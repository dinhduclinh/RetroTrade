const User = require("../../models/User.model");
const { getAdmin } = require("../../config/firebase");
// Ensure fetch is available in Node environments that don't provide global fetch
// Lazy-import node-fetch only when needed to avoid ESM/CJS interop issues
// eslint-disable-next-line no-undef
const fetchFn = typeof fetch !== "undefined" ? fetch : ((...args) => import("node-fetch").then(m => m.default(...args)));

// Send OTP via Firebase Auth REST API
module.exports.sendOtpViaFirebase = async (req, res) => {
    try {
        const { phone, recaptchaToken } = req.body;
        
        if (!phone) {
            return res.status(400).json({ code: 400, message: "Thiếu số điện thoại" });
        }

        const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
        const usingEmulator = Boolean(emulatorHost);
        const apiKey = usingEmulator ? "dummy" : process.env.FIREBASE_WEB_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ code: 500, message: "Thiếu FIREBASE_WEB_API_KEY trong môi trường" });
        }

        const baseUrl = usingEmulator
            ? `http://${emulatorHost}/identitytoolkit.googleapis.com/v1`
            : `https://identitytoolkit.googleapis.com/v1`;

        const payload = usingEmulator
            ? { phoneNumber: phone }
            : { phoneNumber: phone, recaptchaToken };

        if (!usingEmulator && !recaptchaToken) {
            return res.status(400).json({ code: 400, message: "Thiếu recaptchaToken (production)" });
        }

        const response = await fetchFn(`${baseUrl}/accounts:sendVerificationCode?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            return res.status(400).json({ 
                code: 400, 
                message: data.error?.message || "Gửi OTP thất bại", 
                error: data
            });
        }
        
        return res.json({ 
            code: 200, 
            message: "Đã gửi OTP qua Firebase", 
            data: { sessionInfo: data.sessionInfo } 
        });
    } catch (error) {
        return res.status(500).json({ 
            code: 500, 
            message: "Lỗi khi gửi OTP", 
            error: error.message
        });
    }
}

// Verify OTP via Firebase Auth REST API, then mark user phone confirmed
module.exports.verifyOtpViaFirebase = async (req, res) => {
    try {
        const { sessionInfo, code } = req.body;
        if (!sessionInfo || !code) {
            return res.status(400).json({ code: 400, message: "Thiếu sessionInfo hoặc mã OTP" });
        }

        const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
        const usingEmulator = Boolean(emulatorHost); // Re-enable emulator detection
        const apiKey = usingEmulator ? "dummy" : process.env.FIREBASE_WEB_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ code: 500, message: "Thiếu FIREBASE_WEB_API_KEY trong môi trường" });
        }

        const baseUrl = usingEmulator
            ? `http://${emulatorHost}/identitytoolkit.googleapis.com/v1`
            : `https://identitytoolkit.googleapis.com/v1`;

        const response = await fetchFn(`${baseUrl}/accounts:signInWithPhoneNumber?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionInfo, code })
        });
        const data = await response.json();
        if (!response.ok) {
            return res.status(400).json({ code: 400, message: data.error?.message || "Xác minh OTP thất bại", error: data });
        }

        // Verify ID token and update user phone confirmation status
        const admin = getAdmin();
        const decoded = await admin.auth().verifyIdToken(data.idToken);
        const phoneNumber = decoded.phone_number;

        const user = await User.findOneAndUpdate(
            { phone: phoneNumber },
            { isPhoneConfirmed: true },
            { new: true }
        );

        return res.json({ 
            code: 200, 
            message: "Xác minh OTP thành công", 
            data: { phone: phoneNumber, userId: user ? user._id : null } 
        });
    } catch (error) {
        return res.status(500).json({ code: 500, message: "Lỗi khi xác minh OTP", error: error.message });
    }
}

module.exports.confirmPhoneWithFirebaseIdToken = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ code: 400, message: "Thiếu Firebase ID token" });
        }

        const admin = getAdmin();
        const decoded = await admin.auth().verifyIdToken(idToken);
        // decoded.phone_number is present if user signed in with phone
        const phoneNumber = decoded.phone_number;
        if (!phoneNumber) {
            return res.status(400).json({ code: 400, message: "ID token không chứa số điện thoại" });
        }

        const user = await User.findOneAndUpdate(
            { phone: phoneNumber },
            { isPhoneConfirmed: true },
            { new: true }
        );

        return res.json({ code: 200, message: "Xác minh số điện thoại (Firebase) thành công", data: { userId: user ? user._id : null, phone: phoneNumber } });
    } catch (error) {
        return res.status(500).json({ code: 500, message: "Xác minh Firebase ID token thất bại", error: error.message });
    }
}


