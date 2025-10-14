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
                message: "User not found"
            });
        }


        const isPasswordValid = await comparePasswordWithSalt(password, user.passwordSalt, user.passwordHash);
        if (!isPasswordValid) {
            return res.json({
                code: 400,
                message: "Incorrect password"
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
                message: "Email not verified"
            });
        }

        const accessToken = jwt.sign({ email: user.email }, process.env.TOKEN_SECRET, { expiresIn: "7d" });
        const refreshToken = jwt.sign({ email: user.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

        await User.findOneAndUpdate({ email: user.email }, { re_token: refreshToken }, { new: true });

        return res.json({
            code: 200,
            message: "Login successfully",
            data: {
                accessToken: accessToken,
                refreshToken: refreshToken
            }
        });
    } catch (error) {
        return res.json({
            code: 500,
            message: "Failed to login",
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
            email: existingUser.email,
            userGuid: existingUser.userGuid,
            avatarUrl: existingUser.avatarUrl,
            fullName: existingUser.fullName,
            role: existingUser.role
        }
        const accessToken = jwt.sign(dataToken, process.env.TOKEN_SECRET, { expiresIn: "7d" });
        const refreshToken = jwt.sign(dataToken, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
        await User.findOneAndUpdate({ email: existingUser.email }, { re_token: refreshToken }, { new: true });
        return res.json({ code: 200, message: "Login with Google successfully", data: { accessToken: accessToken, refreshToken: refreshToken } });
    } catch (error) {
        return res.json({ code: 500, message: "Failed to login with Google", error: error.message });
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
            email: existingUser.email,
            userGuid: existingUser.userGuid,
            avatarUrl: existingUser.avatarUrl,
            fullName: existingUser.fullName,
            role: existingUser.role
        }
        const accessToken = jwt.sign(dataToken, process.env.TOKEN_SECRET, { expiresIn: "7d" });
        const refreshToken = jwt.sign(dataToken, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
        await User.findOneAndUpdate({ email: existingUser.email }, { re_token: refreshToken }, { new: true });
        return res.json({ code: 200, message: "Login with Facebook successfully", data: { accessToken: accessToken, refreshToken: refreshToken } });
    } catch (error) {
        return res.json({ code: 500, message: "Failed to login with Facebook", error: error.message });
    }
}


module.exports.register = async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        if (!email || !password || !fullName) {
            return res.json({
                code: 400,
                message: "Email, password and fullName are required"
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({
                code: 409,
                message: existingUser.email === req.body.email ? "Email already in use" : "User already in use"
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
                    Account Verification
                </div>
                <div class="email-body">
                    <p>Dear User, ${fullName}</p>
                    <p>To complete the verification process for your account, please use the following One-Time Password (OTP):</p>
                    <h3 class="otp">${otp}</h3>
                    <p>This OTP is valid for the next <strong>3 minutes</strong>. For your security, please do not share this OTP with anyone.</p>
                    <p>If you did not request this, please ignore this email or contact our support team immediately.</p>
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
            message: "Registered successfully",
            data: sanitized
        });

    } catch (error) {
        return res.json({
            code: 500,
            message: "Failed to register",
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
                message: "Invalid OTP"
            });
        }
        const user = await User.findOneAndUpdate({ email }, { isEmailConfirmed: true }, { new: true });
        return res.json({
            code: 200,
            message: "Account verified email successfully",
            data: user
        });
    } catch (error) {
        return res.json({
            code: 500,
            message: "Failed to verify account",
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
                message: "User not found"
            });
        }

        const verifyAccount = await User.findOne({ email, isEmailConfirmed: true });
        if (verifyAccount) {
            return res.json({
                code: 400,
                message: "Account already verified"
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
            message: "Resend OTP to email successfully",
            data: verifyEmail
        });
    } catch (error) {
        return res.json({
            code: 500,
            message: "Failed to resend OTP to email",
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
                message: "User not found"
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

        const subject = "Your One-Time Password (OTP) for Forgot Password";
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
                        Forgot Password
                    </div>
                    <div class="email-body">
                        <p>Hello, ${user.fullName}</p>
                        <p>We have received a request to reset your password.</p>
                        <p>Please use the OTP below to reset your password:</p>
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
            message: "OTP sent to email",
            data: verifyEmail
        });
    } catch (error) {
        return res.json({
            code: 500,
            message: "Failed to send OTP to email",
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
                message: "Invalid OTP or OTP expired"
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                code: 400,
                message: "User not found"
            });
        }

        return res.json({
            code: 200,
            message: "OTP is correct",
        });
    } catch (error) {
        return res.json({
            code: 500,
            message: "Failed to verify OTP",
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
                message: "User not found"
            });
        }
        const hashedPassword = await hashPasswordWithSalt(password, user.passwordSalt);
        await User.findOneAndUpdate({ email }, { passwordHash: hashedPassword }, { new: true });

        const sanitized = user.toObject();
        delete sanitized.passwordHash;
        delete sanitized.passwordSalt;

        const subject = "Password Reset Successfully";
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
                        Password Reset Successfully
                    </div>
                    <div class="email-body">
                        <p>Dear, ${user.fullName}</p>
                        <p>Your password has been reset successfully at ${new Date().toLocaleString()}.</p>
                        <p>If you did not request this, please ignore this email or contact our support team immediately.</p>
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
            message: "Password reset successfully",
            data: sanitized
        });
    } catch (error) {
        return res.json({
            code: 500,
            message: "Failed to reset password",
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
                email: user.email, 
                userGuid: user.userGuid,
                avatarUrl: user.avatarUrl,
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

