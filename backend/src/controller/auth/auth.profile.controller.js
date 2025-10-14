const User = require("../../models/User.model")
const { hashPasswordWithSalt, comparePasswordWithSalt } = require("../../utils/bcryptHelper")

module.exports.getProfile = async (req, res) => {
    try {
        const email = req.user.email;

        const user = await User.findOne({
            email: email
        }).select("userGuid email fullName displayName avatarUrl bio phone isEmailConfirmed isPhoneConfirmed isIdVerified reputationScore points role wallet lastLoginAt createdAt updatedAt").lean();

        if (!user) {
            return res.json({
                code: 404,
                message: "User not found"
            });
        }

        return res.json({
            code: 200,
            message: "Get Profile Successfully",
            user
        });
    } catch (error) {
        return res.json({ code: 500, message: "Failed to get profile", error: error.message });
    }
};

module.exports.updateProfile = async (req, res) => {
    try {
        const email = req.user.email;
        const { fullName, displayName, bio } = req.body;
        const user = await User.findOneAndUpdate({ email: email }, { fullName, displayName, bio }, { new: true }).lean();
        if (!user) {
            return res.json({
                code: 404,
                message: "User not found"
            });
        }
        return res.json({
            code: 200,
            message: "Update Profile Successfully",
            user
        });
    } catch (error) {
        return res.json({ code: 500, message: "Failed to update profile", error: error.message });
    }
}

module.exports.updateAvatar = async (req, res) => {
    try {
        const email = req.user.email;
        const { avatarUrl } = req.body;
        const user = await User.findOneAndUpdate({ email: email }, { avatarUrl }, { new: true }).lean();

        if (!user) {
            return res.json({
                code: 404,
                message: "User not found"
            });
        }

        return res.json({
            code: 200,
            message: "Update Avatar Successfully",
            user
        });
    } catch (error) {
        return res.json({ code: 500, message: "Failed to update avatar", error: error.message });
    }
}

module.exports.changePassword = async (req, res) => {
    try {
        const email = req.user.email;
        const { currentPassword, newPassword } = req.body;
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.json({ code: 404, message: "User not found" });
        }
        const isPasswordValid = await comparePasswordWithSalt(currentPassword, user.passwordSalt, user.passwordHash);
        if (!isPasswordValid) {
            return res.json({ code: 400, message: "Old password is incorrect" });
        }
        const hashedPassword = await hashPasswordWithSalt(newPassword, user.passwordSalt);
        await User.findOneAndUpdate({ email: email }, { passwordHash: hashedPassword }, { new: true });
        return res.json({ code: 200, message: "Password changed successfully" });
    } catch (error) {
        return res.json({ code: 500, message: "Failed to change password", error: error.message });
    }
}