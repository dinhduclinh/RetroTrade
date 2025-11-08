const VerificationRequest = require("../../models/VerificationRequest.model");
const User = require("../../models/User.model");
const { uploadToCloudinary } = require('../../middleware/upload.middleware');
const { createNotification } = require("../../middleware/createNotification");

// User gửi yêu cầu xác minh
module.exports.createVerificationRequest = async (req, res) => {
    try {
        const userId = req.user._id;
        let idCardInfo = null;
        let reason = null;
        
        // Parse idCardInfo from form data if provided
        if (req.body.idCardInfo) {
            try {
                idCardInfo = typeof req.body.idCardInfo === 'string' 
                    ? JSON.parse(req.body.idCardInfo) 
                    : req.body.idCardInfo;
            } catch (parseError) {
                console.error('Error parsing idCardInfo:', parseError);
            }
        }
        
        // Get reason from form data
        reason = req.body.reason || null;
        const files = req.files || [];

        // Kiểm tra xem user đã có yêu cầu pending chưa
        const existingRequest = await VerificationRequest.findOne({
            userId: userId,
            status: { $in: ['Pending', 'In Progress'] }
        });

        if (existingRequest) {
            return res.status(400).json({
                code: 400,
                message: "Bạn đã có yêu cầu xác minh đang chờ xử lý. Vui lòng chờ moderator xử lý."
            });
        }

        // Upload ảnh lên Cloudinary nếu có
        let uploadedFiles = [];
        if (files && files.length > 0) {
            try {
                uploadedFiles = await uploadToCloudinary(files, "retrotrade/verification-requests/");
            } catch (uploadError) {
                console.error('Error uploading files:', uploadError);
                return res.status(500).json({
                    code: 500,
                    message: "Lỗi khi upload ảnh. Vui lòng thử lại.",
                    error: uploadError.message
                });
            }
        }

        // Tạo documents array
        const documentTypes = ['selfie', 'idCardFront', 'idCardBack'];
        const documents = uploadedFiles.map((file, index) => {
            return {
                documentType: documentTypes[index] || 'document',
                fileUrl: file.Url,
                uploadedAt: new Date()
            };
        });

        // Tạo verification request
        const verificationRequest = new VerificationRequest({
            userId: userId,
            idCardInfo: idCardInfo ? {
                idNumber: idCardInfo.idNumber,
                fullName: idCardInfo.fullName,
                dateOfBirth: idCardInfo.dateOfBirth ? new Date(idCardInfo.dateOfBirth) : null,
                address: idCardInfo.address
            } : null,
            documents: documents,
            reason: reason || null,
            status: 'Pending'
        });

        await verificationRequest.save();

        // Populate user info
        await verificationRequest.populate('userId', 'fullName email phone');

        // Gửi notification cho tất cả moderators
        try {
            const moderators = await User.find({ role: 'moderator', isDeleted: false });
            for (const moderator of moderators) {
                await createNotification(
                    moderator._id,
                    "New Verification Request",
                    "Yêu cầu xác minh mới",
                    `Có yêu cầu xác minh mới từ ${req.user.fullName || req.user.email}. Vui lòng xử lý.`,
                    {
                        requestId: verificationRequest._id.toString(),
                        userId: userId.toString(),
                        type: 'verification_request'
                    }
                );
            }
        } catch (notificationError) {
            console.error("Error creating notifications:", notificationError);
        }

        return res.json({
            code: 200,
            message: "Yêu cầu xác minh đã được gửi thành công. Moderator sẽ xử lý trong thời gian sớm nhất.",
            data: verificationRequest
        });
    } catch (error) {
        console.error('Error creating verification request:', error);
        return res.status(500).json({
            code: 500,
            message: "Lỗi server khi tạo yêu cầu xác minh.",
            error: error.message
        });
    }
};

// User xem yêu cầu của mình
module.exports.getMyVerificationRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status } = req.query;

        const query = { userId: userId };
        if (status) {
            query.status = status;
        }

        const requests = await VerificationRequest.find(query)
            .populate('assignedTo', 'fullName email')
            .populate('handledBy', 'fullName email')
            .sort({ createdAt: -1 });

        return res.json({
            code: 200,
            message: "Lấy danh sách yêu cầu xác minh thành công",
            data: requests
        });
    } catch (error) {
        console.error('Error getting verification requests:', error);
        return res.status(500).json({
            code: 500,
            message: "Lỗi server khi lấy danh sách yêu cầu xác minh.",
            error: error.message
        });
    }
};

// Moderator xem tất cả yêu cầu
module.exports.getAllVerificationRequests = async (req, res) => {
    try {
        const { status, assignedTo } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }
        if (assignedTo) {
            query.assignedTo = assignedTo;
        }

        const requests = await VerificationRequest.find(query)
            .populate('userId', 'fullName email phone avatarUrl')
            .populate('assignedTo', 'fullName email')
            .populate('handledBy', 'fullName email')
            .sort({ createdAt: -1 });

        return res.json({
            code: 200,
            message: "Lấy danh sách yêu cầu xác minh thành công",
            data: requests,
            total: requests.length
        });
    } catch (error) {
        console.error('Error getting all verification requests:', error);
        return res.status(500).json({
            code: 500,
            message: "Lỗi server khi lấy danh sách yêu cầu xác minh.",
            error: error.message
        });
    }
};

// Moderator xem chi tiết yêu cầu
module.exports.getVerificationRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await VerificationRequest.findById(id)
            .populate('userId', 'fullName email phone avatarUrl isIdVerified')
            .populate('assignedTo', 'fullName email')
            .populate('handledBy', 'fullName email');

        if (!request) {
            return res.status(404).json({
                code: 404,
                message: "Không tìm thấy yêu cầu xác minh"
            });
        }

        return res.json({
            code: 200,
            message: "Lấy thông tin yêu cầu xác minh thành công",
            data: request
        });
    } catch (error) {
        console.error('Error getting verification request:', error);
        return res.status(500).json({
            code: 500,
            message: "Lỗi server khi lấy thông tin yêu cầu xác minh.",
            error: error.message
        });
    }
};

// Moderator nhận yêu cầu (assign)
module.exports.assignVerificationRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const moderatorId = req.user._id;

        const request = await VerificationRequest.findById(id);
        if (!request) {
            return res.status(404).json({
                code: 404,
                message: "Không tìm thấy yêu cầu xác minh"
            });
        }

        if (request.status !== 'Pending') {
            return res.status(400).json({
                code: 400,
                message: "Yêu cầu này đã được xử lý hoặc đang được xử lý bởi moderator khác"
            });
        }

        request.status = 'In Progress';
        request.assignedTo = moderatorId;
        request.assignedAt = new Date();
        await request.save();

        // Gửi notification cho user
        try {
            await createNotification(
                request.userId._id || request.userId,
                "Verification Request Assigned",
                "Yêu cầu xác minh đang được xử lý",
                `Yêu cầu xác minh của bạn đang được moderator xử lý. Chúng tôi sẽ thông báo kết quả sớm nhất.`,
                {
                    requestId: request._id.toString(),
                    type: 'verification_request_assigned'
                }
            );
        } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
        }

        return res.json({
            code: 200,
            message: "Đã nhận yêu cầu xác minh",
            data: request
        });
    } catch (error) {
        console.error('Error assigning verification request:', error);
        return res.status(500).json({
            code: 500,
            message: "Lỗi server khi nhận yêu cầu xác minh.",
            error: error.message
        });
    }
};

// Moderator xử lý yêu cầu (approve/reject)
module.exports.handleVerificationRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, moderatorNotes, rejectionReason, idCardInfo } = req.body;
        const moderatorId = req.user._id;

        if (!['approved', 'rejected'].includes(action)) {
            return res.status(400).json({
                code: 400,
                message: "Action phải là 'approved' hoặc 'rejected'"
            });
        }

        // Validate idCardInfo when approving
        if (action === 'approved') {
            if (!idCardInfo) {
                return res.status(400).json({
                    code: 400,
                    message: "Vui lòng nhập thông tin căn cước công dân"
                });
            }
            if (!idCardInfo.idNumber || !/^\d{12}$/.test(idCardInfo.idNumber)) {
                return res.status(400).json({
                    code: 400,
                    message: "Số căn cước công dân phải có 12 chữ số"
                });
            }
            if (!idCardInfo.fullName || !idCardInfo.fullName.trim()) {
                return res.status(400).json({
                    code: 400,
                    message: "Vui lòng nhập họ và tên"
                });
            }
            if (!idCardInfo.dateOfBirth) {
                return res.status(400).json({
                    code: 400,
                    message: "Vui lòng nhập ngày tháng năm sinh"
                });
            }
            if (!idCardInfo.address || !idCardInfo.address.trim()) {
                return res.status(400).json({
                    code: 400,
                    message: "Vui lòng nhập địa chỉ thường trú"
                });
            }
        }

        const request = await VerificationRequest.findById(id)
            .populate('userId');
        
        if (!request) {
            return res.status(404).json({
                code: 404,
                message: "Không tìm thấy yêu cầu xác minh"
            });
        }

        if (request.status === 'Approved' || request.status === 'Rejected') {
            return res.status(400).json({
                code: 400,
                message: "Yêu cầu này đã được xử lý"
            });
        }

        // Kiểm tra xem moderator có quyền xử lý không (phải là người được assign hoặc chưa được assign)
        if (request.assignedTo && request.assignedTo.toString() !== moderatorId.toString()) {
            return res.status(403).json({
                code: 403,
                message: "Bạn không có quyền xử lý yêu cầu này. Yêu cầu đang được xử lý bởi moderator khác."
            });
        }

        const newStatus = action === 'approved' ? 'Approved' : 'Rejected';
        request.status = newStatus;
        request.handledBy = moderatorId;
        request.handledAt = new Date();
        request.moderatorNotes = moderatorNotes || null;
        request.rejectionReason = action === 'rejected' ? (rejectionReason || null) : null;

        // Nếu approve, cập nhật idCardInfo từ moderator input
        if (action === 'approved' && idCardInfo) {
            request.idCardInfo = {
                idNumber: idCardInfo.idNumber.trim(),
                fullName: idCardInfo.fullName.trim(),
                dateOfBirth: new Date(idCardInfo.dateOfBirth),
                address: idCardInfo.address.trim()
            };
        }

        await request.save();

        // Nếu approve, cập nhật user
        if (action === 'approved') {
            const user = await User.findById(request.userId._id || request.userId);
            if (user) {
                user.isIdVerified = true;
                if (idCardInfo) {
                    user.idCardInfo = {
                        idNumber: idCardInfo.idNumber.trim(),
                        fullName: idCardInfo.fullName.trim(),
                        dateOfBirth: new Date(idCardInfo.dateOfBirth),
                        address: idCardInfo.address.trim(),
                        extractedAt: new Date(),
                        extractionMethod: 'manual'
                    };
                }
                // Thêm documents vào user
                if (request.documents && request.documents.length > 0) {
                    const documentTypes = ['selfie', 'idCardFront', 'idCardBack'];
                    const documents = request.documents.map((doc, index) => {
                        return {
                            documentType: documentTypes[index] || 'document',
                            documentNumber: `DOC-${Date.now()}-${index}`,
                            fileUrl: doc.fileUrl,
                            status: 'approved',
                            submittedAt: doc.uploadedAt || new Date()
                        };
                    });
                    user.documents = user.documents || [];
                    user.documents.push(...documents);
                }
                await user.save();
            }
        }

        await request.save();

        // Gửi notification cho user
        try {
            const message = action === 'approved' 
                ? `Yêu cầu xác minh của bạn đã được duyệt. Tài khoản của bạn đã được xác minh thành công.`
                : `Yêu cầu xác minh của bạn đã bị từ chối. Lý do: ${rejectionReason || 'Không được cung cấp'}`;
            
            await createNotification(
                request.userId._id,
                action === 'approved' ? "Verification Approved" : "Verification Rejected",
                action === 'approved' ? "Xác minh đã được duyệt" : "Xác minh bị từ chối",
                message,
                {
                    requestId: request._id.toString(),
                    type: 'verification_request_handled',
                    action: action
                }
            );
        } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
        }

        return res.json({
            code: 200,
            message: action === 'approved' 
                ? "Yêu cầu xác minh đã được duyệt thành công" 
                : "Yêu cầu xác minh đã bị từ chối",
            data: request
        });
    } catch (error) {
        console.error('Error handling verification request:', error);
        return res.status(500).json({
            code: 500,
            message: "Lỗi server khi xử lý yêu cầu xác minh.",
            error: error.message
        });
    }
};

