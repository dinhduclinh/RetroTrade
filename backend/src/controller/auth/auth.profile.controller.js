const User = require("../../models/User.model")
const { hashPasswordWithSalt, comparePasswordWithSalt } = require("../../utils/bcryptHelper")
const { createNotification } = require("../../middleware/createNotification")

module.exports.getProfile = async (req, res) => {
    try {
        const email = req.user.email;

        const user = await User.findOne({
            email: email
        }).select("userGuid email fullName displayName avatarUrl bio phone isEmailConfirmed isPhoneConfirmed isIdVerified reputationScore points role wallet lastLoginAt createdAt updatedAt").lean();

        if (!user) {
            return res.json({
                code: 404,
                message: "Không tìm thấy người dùng"
            });
        }

        return res.json({
            code: 200,
            message: "Lấy thông tin hồ sơ thành công",
            user
        });
    } catch (error) {
        return res.json({ code: 500, message: "Lỗi khi lấy thông tin hồ sơ", error: error.message });
    }
};

module.exports.updateProfile = async (req, res) => {
    try {
        const email = req.user.email;
        const { fullName, displayName, bio } = req.body;
        
        // Get current user data first
        const currentUser = await User.findOne({ email: email });
        if (!currentUser) {
            return res.json({
                code: 404,
                message: "Không tìm thấy người dùng"
            });
        }
        
        // Check if there are any changes
        const hasChanges = (fullName && fullName !== currentUser.fullName) ||
                          (displayName && displayName !== currentUser.displayName) ||
                          (bio !== undefined && bio !== currentUser.bio);
        
        // Only update if there are actual changes
        if (!hasChanges) {
            return res.json({
                code: 200,
                message: "Không có thay đổi nào",
                data: currentUser
            });
        }
        
        // Update user with new data
        const updatedUser = await User.findOneAndUpdate(
            { email: email }, 
            { fullName, displayName, bio }, 
            { new: true }
        ).lean();
        
        // Create notification for profile update
        try {
            await createNotification(
                currentUser._id,
                "Profile Updated",
                "Thông tin cá nhân đã được cập nhật",
                `Xin chào ${updatedUser.fullName || currentUser.fullName}, thông tin cá nhân của bạn đã được cập nhật thành công vào lúc ${new Date().toLocaleString("vi-VN")}.`,
                { 
                    updateTime: new Date().toISOString(),
                    updatedFields: {
                        fullName: fullName && fullName !== currentUser.fullName ? 'changed' : 'unchanged',
                        displayName: displayName && displayName !== currentUser.displayName ? 'changed' : 'unchanged',
                        bio: bio !== undefined && bio !== currentUser.bio ? 'changed' : 'unchanged'
                    }
                }
            );
        } catch (notificationError) {
            console.error("Error creating profile update notification:", notificationError);
        }
        
        return res.json({
            code: 200,
            message: "Cập nhật hồ sơ thành công",
            data: updatedUser
        });
    } catch (error) {
        return res.json({ code: 500, message: "Cập nhật hồ sơ thất bại", error: error.message });
    }
}

module.exports.updateAvatar = async (req, res) => {
    try {
        const email = req.user.email;
        const { avatarUrl } = req.body;
        
        // Get current user data first
        const currentUser = await User.findOne({ email: email });
        if (!currentUser) {
            return res.json({
                code: 404,
                message: "Không tìm thấy người dùng"
            });
        }
        
        // Check if avatar is actually changing
        if (avatarUrl === currentUser.avatarUrl) {
            return res.json({
                code: 200,
                message: "Không có thay đổi nào",
                data: currentUser
            });
        }
        
        // Update avatar
        const updatedUser = await User.findOneAndUpdate(
            { email: email }, 
            { avatarUrl }, 
            { new: true }
        ).lean();

        // Create notification for avatar update
        try {
            await createNotification(
                currentUser._id,
                "Avatar Updated",
                "Ảnh đại diện đã được cập nhật",
                `Xin chào ${updatedUser.fullName || currentUser.fullName}, ảnh đại diện của bạn đã được cập nhật thành công vào lúc ${new Date().toLocaleString("vi-VN")}.`,
                { 
                    updateTime: new Date().toISOString(),
                    newAvatarUrl: avatarUrl
                }
            );
        } catch (notificationError) {
            console.error("Error creating avatar update notification:", notificationError);
        }

        return res.json({
            code: 200,
            message: "Cập nhật ảnh đại diện thành công",
            data: updatedUser
        });
    } catch (error) {
        return res.json({ code: 500, message: "Cập nhật ảnh đại diện thất bại", error: error.message });
    }
}

module.exports.changePassword = async (req, res) => {
    try {
        const email = req.user.email;
        const { currentPassword, newPassword } = req.body;
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.json({ code: 404, message: "Không tìm thấy người dùng" });
        }
        const isPasswordValid = await comparePasswordWithSalt(currentPassword, user.passwordSalt, user.passwordHash);
        if (!isPasswordValid) {
            return res.json({ code: 400, message: "Mật khẩu cũ không đúng" });
        }
        const hashedPassword = await hashPasswordWithSalt(newPassword, user.passwordSalt);
        await User.findOneAndUpdate({ email: email }, { passwordHash: hashedPassword }, { new: true });
        
        // Create notification for password change
        try {
            await createNotification(
                user._id,
                "Đổi mật khẩu",
                "Mật khẩu đã được thay đổi",
                `Xin chào ${user.fullName}, mật khẩu tài khoản của bạn đã được thay đổi thành công vào lúc ${new Date().toLocaleString("vi-VN")}. Nếu bạn không thực hiện hành động này, vui lòng liên hệ hỗ trợ ngay.`,
                { 
                    updateTime: new Date().toISOString()
                }
            );
        } catch (notificationError) {
            console.error("Error creating password change notification:", notificationError);
        }
        
        return res.json({ code: 200, message: "Đổi mật khẩu thành công" });
    } catch (error) {
        return res.json({ code: 500, message: "Đổi mật khẩu thất bại", error: error.message });
    }
}

module.exports.uploadUserAvatar = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { avatar: req.file.path }, { new: true });
        if (!user) {
            return res.json({
                code: 404,
                message: "Không tìm thấy người dùng"
            });
        }
        return res.json({ code: 200, message: "Cập nhật ảnh đại diện người dùng thành công", data: user });
    } catch (error) {
        return res.json({ code: 500, message: "Cập nhật ảnh đại diện người dùng thất bại", error: error.message });
    }
}

// COMPLETED FUNCTIONS:
// 1. getProfile - Get user profile information
// 2. updateProfile - Update user profile (fullName, displayName, bio)
// 3. updateAvatar - Update user avatar URL
// 4. changePassword - Change user password with current password validation
// 5. uploadUserAvatar - Upload user avatar file

