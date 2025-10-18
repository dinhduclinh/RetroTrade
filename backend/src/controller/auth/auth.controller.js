const User = require("../../models/User.model")
const jwt = require("jsonwebtoken")
const { generateSalt, hashPasswordWithSalt, comparePasswordWithSalt } = require("../../utils/bcryptHelper")
const { sendEmail } = require("../../utils/sendEmail")
const { generateOtp } = require("../../utils/generateOtp")
const Otp = require("../../models/otp")



module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                code: 400,
                message: "Không tìm thấy người dùng"
            });
        }


        const isPasswordValid = await comparePasswordWithSalt(password, user.passwordSalt, user.passwordHash);
        if (!isPasswordValid) {
            return res.json({
                code: 400,
                message: "Mật khẩu không đúng"
            });
        }
        // if(!user.isEmailConfirmed || !user.isPhoneConfirmed || !user.isIdVerified) {
        //     return res.json({
        //         code: 400,
        //         message: "Email, phone and id not confirmed"
        //     });
        // }

        if (!user.isEmailConfirmed) {
            return res.json({
                code: 400,
                message: "Email chưa được xác minh"
            });
        }

        const dataToken = {
            _id: user._id,
            email: user.email,
            userGuid: user.userGuid,
            avatarUrl: user.avatarUrl,
            fullName: user.fullName,
            role: user.role
        };
        const accessToken = jwt.sign(dataToken, process.env.TOKEN_SECRET, { expiresIn: "7d" });
        const refreshToken = jwt.sign(dataToken, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

        await User.findOneAndUpdate({ email: user.email }, { re_token: refreshToken }, { new: true });

        return res.json({
            code: 200,
            message: "Đăng nhập thành công",
            data: {
                accessToken: accessToken,
                refreshToken: refreshToken
            }
        });
    } catch (error) {
        return res.json({
            code: 500,
            message: "Đăng nhập thất bại",
            error: error.message
        });
    }
}

module.exports.loginWithGoogle = async (req, res) => {
    try {
        const { email, avatarUrl, fullName } = req.body;
        const existingUser = await User.findOne({ email: email });
        if (!existingUser) {
            const newUser = await User.create({
                email: email,
                avatarUrl: avatarUrl,
                fullName: fullName,
                isEmailConfirmed: true,
                passwordHash: "",
                passwordSalt: ""
            });
            await newUser.save();
            existingUser = newUser.toObject();
            delete existingUser.passwordHash;
            delete existingUser.passwordSalt;
        }
        const dataToken = {
            _id: existingUser._id,
            email: existingUser.email,
            userGuid: existingUser.userGuid,
            avatarUrl: existingUser.avatarUrl,
            fullName: existingUser.fullName,
            role: existingUser.role
        }
        const accessToken = jwt.sign(dataToken, process.env.TOKEN_SECRET, { expiresIn: "7d" });
        const refreshToken = jwt.sign(dataToken, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
        await User.findOneAndUpdate({ email: existingUser.email }, { re_token: refreshToken }, { new: true });
        return res.json({ code: 200, message: "Đăng nhập bằng Google thành công", data: { accessToken: accessToken, refreshToken: refreshToken } });
    } catch (error) {
        return res.json({ code: 500, message: "Đăng nhập bằng Google thất bại", error: error.message });
    }
}

module.exports.loginWithFacebook = async (req, res) => {
    try {
        const { email, avatarUrl, fullName } = req.body;
        let existingUser = await User.findOne({ email: email });
        if (!existingUser) {
            const newUser = await User.create({
                email: email,
                avatarUrl: avatarUrl,
                fullName: fullName,
                isEmailConfirmed: true,
                passwordHash: "",
                passwordSalt: ""
            });
            await newUser.save();
            existingUser = newUser.toObject();
            delete existingUser.passwordHash;
            delete existingUser.passwordSalt;
        }
        const dataToken = {
            _id: existingUser._id,
            email: existingUser.email,
            userGuid: existingUser.userGuid,
            avatarUrl: existingUser.avatarUrl,
            fullName: existingUser.fullName,
            role: existingUser.role
        }
        const accessToken = jwt.sign(dataToken, process.env.TOKEN_SECRET, { expiresIn: "7d" });
        const refreshToken = jwt.sign(dataToken, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
        await User.findOneAndUpdate({ email: existingUser.email }, { re_token: refreshToken }, { new: true });
        return res.json({ code: 200, message: "Đăng nhập bằng Facebook thành công", data: { accessToken: accessToken, refreshToken: refreshToken } });
    } catch (error) {
        return res.json({ code: 500, message: "Đăng nhập bằng Facebook thất bại", error: error.message });
    }
}


module.exports.register = async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        if (!email || !password || !fullName) {
            return res.json({
                code: 400,
                message: "Email, mật khẩu và họ tên là bắt buộc"
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({
                code: 409,
                message: existingUser.email === req.body.email ? "Email đã được sử dụng" : "Người dùng đã tồn tại"
            });
        }

        const passwordSalt = generateSalt(16);
        const passwordHash = await hashPasswordWithSalt(password, passwordSalt);
        const user = await User.create({ email, passwordHash, passwordSalt, fullName });

        const sanitized = user.toObject();
        delete sanitized.passwordHash;
        delete sanitized.passwordSalt;

        const otp = await generateOtp(8);
        const verifyOTP = {
            email: email,
            purpose: "verify-email",
            otp: otp,
            "expireAt": Date.now() + 180000
        };
        const verifyEmail = await Otp.create(verifyOTP);
        await verifyEmail.save();

        const subject = "Mã OTP xác minh tài khoản";
        const html = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; background:#f5f7fb; padding: 24px; }
                .wrap { max-width: 640px; margin: 0 auto; background:#ffffff; border-radius: 12px; overflow:hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08); border:1px solid #e5e7eb; }
                .head { background: linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff; padding: 20px 24px; text-align:center; }
                .head h1 { margin:0; font-size: 20px; }
                .body { padding: 24px; }
                .otp { display:inline-block; padding: 12px 16px; border-radius: 10px; background:#f3f4f6; font-weight:700; letter-spacing:2px; font-size:22px; color:#111827; }
                .note { font-size: 13px; color:#6b7280; }
                .footer { background:#f9fafb; color:#6b7280; font-size: 12px; text-align:center; padding: 12px; }
            </style>
        </head>
        <body>
            <div class="wrap">
                <div class="head"><h1>Xác minh tài khoản RetroTrade</h1></div>
                <div class="body">
                    <p>Xin chào <strong>${fullName}</strong>,</p>
                    <p>Để hoàn tất quá trình xác minh tài khoản của bạn, vui lòng sử dụng mã OTP bên dưới:</p>
                    <p><span class="otp">${otp}</span></p>
                    <p class="note">Mã OTP có hiệu lực trong <strong>3 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
                    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ hỗ trợ.</p>
                    <p>Trân trọng,<br/>Đội ngũ RetroTrade</p>
                </div>
                <div class="footer">© 2025 RetroTrade. Bảo lưu mọi quyền.</div>
            </div>
        </body>
        </html>
        `;

        await sendEmail(email, subject, html);

        return res.json({
            code: 200,
            message: "Đăng ký thành công",
            data: sanitized
        });

    } catch (error) {
        return res.json({
            code: 500,
            message: "Đăng ký thất bại",
            error: error.message
        });
    }
}

module.exports.verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const verifyEmail = await Otp.findOne({ email, otp, purpose: "verify-email" });
        if (!verifyEmail) {
            return res.json({
                code: 400,
                message: "OTP không hợp lệ"
            });
        }
        const user = await User.findOneAndUpdate({ email }, { isEmailConfirmed: true }, { new: true });
        return res.json({
            code: 200,
            message: "Xác minh email tài khoản thành công",
            data: user
        });
    } catch (error) {
        return res.json({
            code: 500,
            message: "Xác minh tài khoản thất bại",
            error: error.message
        });
    }
}

module.exports.resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.json({
                code: 400,
                message: "Không tìm thấy người dùng"
            });
        }

        const verifyAccount = await User.findOne({ email, isEmailConfirmed: true });
        if (verifyAccount) {
            return res.json({
                code: 400,
                message: "Tài khoản đã được xác minh"
            });
        }


        const otp = await generateOtp(8);
        const verifyEmail = await Otp.create({
            email: email,
            otp: otp,
            purpose: "verify-email",
            "expireAt": Date.now()
        });
        await verifyEmail.save();

        const subject = "Your One-Time Password (OTP) for Account Verification";
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background-color: #f9f9f9;
                        padding: 20px;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .email-header {
                        background: #4caf50;
                        color: #ffffff;
                        text-align: center;
                        padding: 20px;
                        font-size: 24px;
                    }
                    .email-body {
                        padding: 20px;
                        text-align: left;
                    }
                    .email-body h3 {
                        color: #4caf50;
                    }
                    .email-footer {
                        text-align: center;
                        padding: 10px;
                        background: #f1f1f1;
                        color: #555;
                        font-size: 12px;
                    }
                    .otp {
                        font-size: 24px;
                        font-weight: bold;
                        color: #333;
                        background: #f4f4f4;
                        padding: 10px;
                        border-radius: 8px;
                        display: inline-block;
                        margin: 10px 0;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="email-header">
                        OTP Resend Request
                    </div>
                    <div class="email-body">
                        <p>Hello, ${existingUser.fullName}</p>
                        <p>We have received a request to resend your One-Time Password (OTP) for account verification.</p>
                        <p>Please use the OTP below to verify your account:</p>
                        <h3 class="otp">${otp}</h3>
                        <p>This OTP is valid for the next <strong>3 minutes</strong>. For your security, please do not share this OTP with anyone.</p>
                        <p>If you did not request this OTP, please ignore this email or contact our support team immediately.</p>
                        <p>Thank you,<br>The RetroTrade Team</p>
                    </div>
                    <div class="email-footer">
                        © 2025 RetroTrade. All rights reserved.
                    </div>
                </div>
            </body>
            </html>
        `;

        await sendEmail(email, subject, html);


        return res.json({
            code: 200,
            message: "Gửi lại OTP qua email thành công",
            data: verifyEmail
        });
    } catch (error) {
        return res.json({
            code: 500,
            message: "Gửi lại OTP qua email thất bại",
            error: error.message
        });
    }
};


module.exports.requestForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                code: 400,
                message: "Không tìm thấy người dùng"
            });
        }
        const otp = await generateOtp(8);
        const verifyEmail = await Otp.create({
            email: email,
            otp: otp,
            purpose: "forgot-password",
            "expireAt": Date.now()
        });
        await verifyEmail.save();

        const subject = "Mã OTP đặt lại mật khẩu";
        const html = `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color:#111827; background:#f5f7fb; padding:24px; }
                    .wrap { max-width:640px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,.08); border:1px solid #e5e7eb; }
                    .head { background: linear-gradient(135deg,#ef4444,#f97316); color:#fff; padding:20px 24px; text-align:center; }
                    .head h1 { margin:0; font-size:20px; }
                    .body { padding:24px; }
                    .otp { display:inline-block; padding:12px 16px; border-radius:10px; background:#f3f4f6; font-weight:700; letter-spacing:2px; font-size:22px; color:#111827; }
                    .note { font-size:13px; color:#6b7280; }
                    .footer { background:#f9fafb; color:#6b7280; font-size:12px; text-align:center; padding:12px; }
                </style>
            </head>
            <body>
                <div class="wrap">
                    <div class="head"><h1>Đặt lại mật khẩu</h1></div>
                    <div class="body">
                        <p>Xin chào <strong>${user.fullName}</strong>,</p>
                        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                        <p>Vui lòng sử dụng mã OTP bên dưới để tiếp tục:</p>
                        <p><span class="otp">${otp}</span></p>
                        <p class="note">Mã OTP có hiệu lực trong <strong>3 phút</strong>. Không chia sẻ mã này cho bất kỳ ai.</p>
                        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
                        <p>Trân trọng,<br/>Đội ngũ RetroTrade</p>
                    </div>
                    <div class="footer">© 2025 RetroTrade. Bảo lưu mọi quyền.</div>
                </div>
            </body>
            </html>
        `;
        await sendEmail(email, subject, html);

        return res.json({
            code: 200,
            message: "Đã gửi OTP đến email",
            data: verifyEmail
        });
    } catch (error) {
        return res.json({
            code: 500,
            message: "Gửi OTP đến email thất bại",
            error: error.message
        });
    }
}


module.exports.forgotPasswordOTP = async (req, res) => {
    try {
        const { otp, email } = req.body;

        const otpExist = await Otp.findOne({
            email: email,
            otp: otp,
            purpose: "forgot-password"
        });
        if (!otpExist) {
            return res.json({
                code: 400,
                message: "OTP không hợp lệ hoặc đã hết hạn"
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                code: 400,
                message: "Không tìm thấy người dùng"
            });
        }

        return res.json({
            code: 200,
            message: "OTP hợp lệ",
        });
    } catch (error) {
        return res.json({
            code: 500,
            message: "Xác thực OTP thất bại",
            error: error.message
        });
    }
}


module.exports.forgotPassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                code: 400,
                message: "Không tìm thấy người dùng"
            });
        }
        const hashedPassword = await hashPasswordWithSalt(password, user.passwordSalt);
        await User.findOneAndUpdate({ email }, { passwordHash: hashedPassword }, { new: true });

        const sanitized = user.toObject();
        delete sanitized.passwordHash;
        delete sanitized.passwordSalt;

        const subject = "Đặt lại mật khẩu thành công";
        const html = `
            <!DOCTYPE html>
            <html lang=\"vi\">
            <head>
                <meta charset=\"UTF-8\" />
                <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color:#111827; background:#f5f7fb; padding:24px; }
                    .wrap { max-width:640px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,.08); border:1px solid #e5e7eb; }
                    .head { background: linear-gradient(135deg,#10b981,#22c55e); color:#fff; padding:20px 24px; text-align:center; }
                    .head h1 { margin:0; font-size:20px; }
                    .body { padding:24px; }
                    .footer { background:#f9fafb; color:#6b7280; font-size:12px; text-align:center; padding:12px; }
                </style>
            </head>
            <body>
                <div class=\"wrap\">
                    <div class=\"head\"><h1>Đặt lại mật khẩu thành công</h1></div>
                    <div class=\"body\">
                        <p>Xin chào <strong>${user.fullName}</strong>,</p>
                        <p>Mật khẩu của bạn đã được đặt lại thành công vào lúc ${new Date().toLocaleString("vi-VN")}.</p>
                        <p>Nếu bạn không thực hiện hành động này, vui lòng liên hệ bộ phận hỗ trợ ngay.</p>
                        <p>Trân trọng,<br/>Đội ngũ RetroTrade</p>
                    </div>
                    <div class=\"footer\">© 2025 RetroTrade. Bảo lưu mọi quyền.</div>
                </div>
            </body>
            </html>
        `;
        await sendEmail(email, subject, html);

        return res.json({
            code: 200,
            message: "Đặt lại mật khẩu thành công",
            data: sanitized
        });
    } catch (error) {
        return res.json({
            code: 500,
            message: "Đặt lại mật khẩu thất bại",
            error: error.message
        });
    }
}




module.exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const user = await User.findOne({ re_token: refreshToken });
        if (!user) return res.json({ code: 403, message: "Invalid refresh token" });

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err) => {
            if (err) return res.json({ code: 403, message: "Token expired or invalid" });

            const newAccessToken = jwt.sign({
                _id: user._id,
                email: user.email,
                userGuid: user.userGuid,
                avatarUrl: user.avatarUrl,
                fullName: user.fullName,
                role: user.role
            }, process.env.TOKEN_SECRET, {
                expiresIn: "15m",
            });

            return res.json({
                code: 200,
                message: "Token refreshed successfully",
                data: newAccessToken
            });
        });
    } catch (error) {
        return res.json({
            code: 500,
            message: "Failed to refresh token",
            error: error.message
        });
    }
};

