const User = require("../../models/User.model");

module.exports.getAllUsers = async (req, res) => {
    try {
        const { skip = 0, limit = 10, page = 1 } = req.pagination || {};

        const [users, totalItems] = await Promise.all([
            User.find()
                .select('userGuid email fullName displayName avatarUrl role isEmailConfirmed isPhoneConfirmed isIdVerified reputationScore points createdAt')
                .skip(skip)
                .limit(limit),
            User.countDocuments()
        ]);

        return res.json({
            code: 200,
            message: "Lấy danh sách người dùng thành công",
            data: {
                items: users,
                ...(res.paginationMeta ? res.paginationMeta(totalItems) : { page, limit, totalItems, totalPages: Math.max(Math.ceil(totalItems / (limit || 1)), 1) })
            }
        });
    } catch (error) {
        return res.json({ code: 500, message: "Lấy danh sách người dùng thất bại", error: error.message });
    }
};

module.exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('userGuid email fullName displayName avatarUrl bio role isEmailConfirmed isPhoneConfirmed isIdVerified reputationScore points createdAt updatedAt');
        if (!user) return res.json({ code: 404, message: "Không tìm thấy người dùng" });
        return res.json({ code: 200, message: "Lấy thông tin người dùng thành công", data: user });
    } catch (error) {
        return res.json({ code: 500, message: "Lấy thông tin người dùng thất bại", error: error.message });
    }
};

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

        res.json({
            code: 200,
            message: "Get Profile Successfully",
            user
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

module.exports.createUser = async (req, res) => {
    try {
        const user = await User.create(req.body);
        return res.json({ code: 201, message: "User created", data: user });
    } catch (error) {
        return res.status(400).json({ message: "Failed to create user", error: error.message });
    }
};

module.exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) return res.json({ code: 404, message: "User not found" });
        return res.json({ code: 200, message: "User updated", data: user });
    } catch (error) {
        return res.json({ code: 400, message: "Failed to update user", error: error.message });
    }
};


module.exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.json({ code: 404, message: "Không tìm thấy người dùng" });
        return res.json({ code: 200, message: "Xóa người dùng thành công", data: user });
    } catch (error) {
        return res.json({ code: 400, message: "Xóa người dùng thất bại", error: error.message });
    }
};

module.exports.updateUserRole = async (req, res) => {
    try {
        const { id, role } = req.body;
        
        // Validate input
        if (!id || !role) {
            return res.json({
                code: 400,
                message: "Thiếu thông tin id hoặc role"
            });
        }

        // Validate role
        const validRoles = ['renter', 'owner', 'moderator', 'admin'];
        if (!validRoles.includes(role)) {
            return res.json({
                code: 400,
                message: "Role không hợp lệ"
            });
        }

        // Prevent moderator from promoting to admin
        if (req.user.role === 'moderator' && role === 'admin') {
            return res.json({
                code: 403,
                message: "Moderator không có quyền nâng cấp thành admin"
            });
        }

        const user = await User.findByIdAndUpdate(id, { role }, { new: true });
        if (!user) {
            return res.json({
                code: 404,
                message: "Không tìm thấy người dùng"
            });
        }
        return res.json({ code: 200, message: "Cập nhật vai trò người dùng thành công", data: user });
    } catch (error) {
        return res.json({ code: 500, message: "Cập nhật vai trò người dùng thất bại", error: error.message });
    }
};

