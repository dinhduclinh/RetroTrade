const User = require("../../models/User.model");

module.exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        return res.json({ code: 200, message: "Users fetched", data: users });
    } catch (error) {
        return res.json({ code: 500, message: "Failed to fetch users", error: error.message });
    }
};

module.exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.json({ code: 404, message: "User not found" });
        return res.json({ code: 200, message: "User found", data: user });
    } catch (error) {
        return res.json({ code: 500, message: "Failed to fetch user", error: error.message });
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
        if (!user) return res.json({ code: 404, message: "User not found" });
        return res.json({ code: 200, message: "User deleted", data: user });
    } catch (error) {
        return res.json({ code: 400, message: "Failed to delete user", error: error.message });
    }
};

