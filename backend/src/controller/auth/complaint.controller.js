const Complaint = require("../../models/Complaint.model");
const User = require("../../models/User.model");
const { sendEmail } = require("../../utils/sendEmail");
const { createNotification } = require("../../middleware/createNotification");

/**
 * Gửi khiếu nại về tài khoản bị khóa
 */
const submitComplaint = async (req, res) => {
    try {
        const { email, message, subject } = req.body;

        // Validate input
        if (!email || !message) {
            return res.json({
                code: 400,
                message: "Vui lòng nhập đầy đủ email và nội dung khiếu nại"
            });
        }

        // Check if user exists (optional)
        const user = await User.findOne({ email: email.toLowerCase() });

        // Create complaint
        const complaint = await Complaint.create({
            email: email.toLowerCase(),
            userId: user ? user._id : null,
            subject: subject || "Khiếu nại về tài khoản bị khóa",
            message: message.trim(),
            status: 'pending'
        });

        // Send notification to admins
        try {
            const admins = await User.find({ role: 'admin', isDeleted: false });
            
            for (const admin of admins) {
                await createNotification({
                    userId: admin._id,
                    type: 'complaint',
                    title: 'Khiếu nại mới về tài khoản bị khóa',
                    message: `Người dùng ${email} đã gửi khiếu nại về tài khoản bị khóa. Vui lòng xem xét.`,
                    link: `/admin/complaints/${complaint._id}`,
                    relatedUserId: user ? user._id : null
                });

                // Send email to admin (optional)
                try {
                    const emailHtml = `
                        <h2>Khiếu nại mới về tài khoản bị khóa</h2>
                        <p><strong>Email người dùng:</strong> ${email}</p>
                        <p><strong>Chủ đề:</strong> ${complaint.subject}</p>
                        <p><strong>Nội dung:</strong></p>
                        <p>${message}</p>
                        <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                        <p>Vui lòng xem xét và phản hồi người dùng.</p>
                    `;
                    await sendEmail(admin.email, `[RetroTrade] Khiếu nại mới về tài khoản bị khóa - ${email}`, emailHtml);
                } catch (emailError) {
                    console.error("Error sending email to admin:", emailError);
                    // Continue even if email fails
                }
            }
        } catch (notifError) {
            console.error("Error creating notifications:", notifError);
            // Continue even if notification fails
        }

        return res.json({
            code: 200,
            message: "Gửi khiếu nại thành công. Chúng tôi sẽ xem xét và phản hồi bạn trong thời gian sớm nhất.",
            data: {
                complaintId: complaint._id,
                status: complaint.status
            }
        });
    } catch (error) {
        console.error("Error submitting complaint:", error);
        return res.json({
            code: 500,
            message: "Lỗi server khi gửi khiếu nại",
            error: error.message
        });
    }
};

module.exports = {
    submitComplaint
};

