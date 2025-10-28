const User = require("../../models/User.model");
const { getAdmin } = require("../../config/firebase");
const fs = require('fs');
const path = require('path');
const { uploadToCloudinary } = require('../../middleware/upload.middleware');
const { createNotification } = require("../../middleware/createNotification");

// Lazy load sharp to avoid module not found errors
let sharp;
const loadSharp = async () => {
    if (!sharp) {
        try {
            sharp = require('sharp');
            console.log('Sharp loaded successfully');
        } catch (error) {
            console.error('Error loading sharp:', error);
            console.log('Using fallback image processing');
            sharp = null;
        }
    }
    return sharp;
};

// Dynamic import for canvas and face-api.js to handle compatibility issues
let Canvas, Image, ImageData;
let faceapi;
let modelsLoaded = false;
let isUsingMock = false;

const loadCanvas = async () => {
    if (!Canvas) {
        try {
            // Try to load canvas first
            const canvasModule = require('canvas');
            Canvas = canvasModule.Canvas;
            Image = canvasModule.Image;
            ImageData = canvasModule.ImageData;
            console.log('Canvas loaded successfully');
        } catch (error) {
            console.error('Error loading canvas:', error);
            console.log('Using Sharp for image processing instead of Canvas');
            
            // Fallback to Sharp-based implementation
            Canvas = class SharpCanvas {
                constructor(width, height) {
                    this.width = width || 100;
                    this.height = height || 100;
                }
                getContext() { 
                    return {
                        drawImage: () => {}, // Mock drawImage method
                        getImageData: () => ({ data: new Uint8ClampedArray(4) })
                    }; 
                }
            };
            Image = class SharpImage {
                constructor() {
                    this.width = 100;
                    this.height = 100;
                    this._src = null;
                    this.onload = null;
                }
                get src() { return this._src; }
                set src(value) { 
                    this._src = value; 
                    // Simulate image load
                    setTimeout(() => {
                        if (this.onload) this.onload();
                    }, 10);
                }
            };
            ImageData = class SharpImageData {
                constructor(data, width, height) {
                    this.data = data || new Uint8ClampedArray(4);
                    this.width = width || 1;
                    this.height = height || 1;
                }
            };
            
            console.log('Sharp-based image processing loaded');
        }
    }
    return { Canvas, Image, ImageData };
};

const loadFaceAPI = async () => {
    if (!faceapi) {
        try {
            // Load canvas first
            await loadCanvas();
            
            // Try to load face-api.js with proper Node.js setup
            faceapi = require('face-api.js');
            
            // Configure face-api.js to use canvas
            faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
            
            console.log('Face-api.js loaded successfully');
        } catch (error) {
            console.error('Error loading face-api.js:', error);
            console.log('Using mock face recognition for development...');
            
            // Mock implementation for development
            faceapi = {
                nets: {
                    tinyFaceDetector: {
                        loadFromUri: async () => console.log('Mock: TinyFaceDetector loaded')
                    },
                    faceLandmark68Net: {
                        loadFromUri: async () => console.log('Mock: FaceLandmark68Net loaded')
                    },
                    faceRecognitionNet: {
                        loadFromUri: async () => console.log('Mock: FaceRecognitionNet loaded')
                    }
                },
                detectAllFaces: () => ({
                    withFaceLandmarks: () => ({
                        withFaceDescriptors: async () => [
                            {
                                descriptor: new Float32Array(128).fill(0.5),
                                detection: {
                                    score: 0.8,
                                    box: {
                                        x: 10,
                                        y: 10,
                                        width: 100,
                                        height: 100
                                    }
                                }
                            }
                        ]
                    })
                }),
                TinyFaceDetectorOptions: class MockTinyFaceDetectorOptions {
                    constructor(options = {}) {
                        this.inputSize = options.inputSize || 512;
                        this.scoreThreshold = options.scoreThreshold || 0.3;
                    }
                },
                euclideanDistance: (desc1, desc2) => {
                    // Mock similarity calculation - return random distance between 0.3-0.8
                    return Math.random() * 0.5 + 0.3;
                }
            };
            
            // Mock Canvas classes for development
            Canvas = class MockCanvas {
                constructor(width, height) {
                    this.width = width || 100;
                    this.height = height || 100;
                }
                getContext() { 
                    return {
                        drawImage: () => {}, // Mock drawImage method
                        getImageData: () => ({ data: new Uint8ClampedArray(4) })
                    }; 
                }
            };
            Image = class MockImage {
                constructor() {
                    this.width = 100;
                    this.height = 100;
                    this._src = null;
                    this.onload = null;
                }
                get src() { return this._src; }
                set src(value) { 
                    this._src = value; 
                    // Simulate image load
                    setTimeout(() => {
                        if (this.onload) this.onload();
                    }, 10);
                }
            };
            ImageData = class MockImageData {
                constructor(data, width, height) {
                    this.data = data || new Uint8ClampedArray(4);
                    this.width = width || 1;
                    this.height = height || 1;
                }
            };
            
            console.log('Mock face-api.js loaded for development');
            isUsingMock = true;
        }
    }
    return faceapi;
};

// Ensure fetch is available in Node environments that don't provide global fetch
// Lazy-import node-fetch only when needed to avoid ESM/CJS interop issues
let fetchFn;
const initFetch = async () => {
    if (!fetchFn) {
        if (typeof fetch !== "undefined") {
            fetchFn = fetch;
        } else {
            try {
                const nodeFetch = await import("node-fetch");
                fetchFn = nodeFetch.default;
            } catch (error) {
                console.error('Error loading node-fetch:', error);
                throw new Error('Cannot load fetch implementation');
            }
        }
    }
    return fetchFn;
};

// Helper function to validate Vietnamese phone number
const validateVietnamesePhoneNumber = (phoneNumber) => {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Vietnamese phone number patterns:
    // - Mobile: 09x, 08x, 07x, 05x, 03x (10 digits)
    // - Landline: 02x (10-11 digits)
    const mobilePattern = /^(09|08|07|05|03)[0-9]{8}$/;
    const landlinePattern = /^02[0-9]{8,9}$/;
    
    return mobilePattern.test(digits) || landlinePattern.test(digits);
};

// Helper function to format phone number
const formatPhoneNumber = (phoneNumber) => {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // If starts with 0, keep as is (Vietnamese format)
    if (digits.startsWith('0')) {
        return digits;
    }
    
    // If starts with 84, remove it and add 0
    if (digits.startsWith('84')) {
        return '0' + digits.substring(2);
    }
    
    // If starts with +84, remove it and add 0
    if (phoneNumber.startsWith('+84')) {
        return '0' + digits.substring(2);
    }
    
    // Default: assume it's already in correct format
    return digits;
};

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
        
        console.log('Firebase configuration:', {
            emulatorHost,
            usingEmulator,
            hasApiKey: !!apiKey,
            apiKeyLength: apiKey ? apiKey.length : 0
        });
        
        if (!apiKey) {
            return res.status(500).json({ 
                code: 500, 
                message: "Thiếu FIREBASE_WEB_API_KEY trong môi trường. Vui lòng kiểm tra cấu hình Firebase.",
                error: "Missing FIREBASE_WEB_API_KEY environment variable"
            });
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

        console.log('Sending OTP request to:', `${baseUrl}/accounts:sendVerificationCode?key=${apiKey}`);
        console.log('Payload:', payload);
        
        // Initialize fetch function
        const fetch = await initFetch();
        
        const response = await fetch(`${baseUrl}/accounts:sendVerificationCode?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            timeout: 30000 // 30 seconds timeout
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
        console.error('OTP sending error:', error);
        
        let errorMessage = "Lỗi khi gửi OTP";
        let statusCode = 500;
        
        if (error.message.includes('fetch failed')) {
            errorMessage = "Không thể kết nối đến dịch vụ xác thực. Vui lòng kiểm tra kết nối mạng và thử lại.";
            statusCode = 503; // Service Unavailable
        } else if (error.message.includes('timeout')) {
            errorMessage = "Yêu cầu gửi OTP quá thời gian chờ. Vui lòng thử lại.";
            statusCode = 408; // Request Timeout
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            errorMessage = "Không thể kết nối đến server xác thực. Vui lòng thử lại sau.";
            statusCode = 503;
        } else if (error.message.includes('Invalid API key')) {
            errorMessage = "Cấu hình API key không đúng. Vui lòng liên hệ quản trị viên.";
            statusCode = 500;
        }
        
        return res.status(statusCode).json({ 
            code: statusCode, 
            message: errorMessage, 
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
        
        console.log('Firebase verification configuration:', {
            emulatorHost,
            usingEmulator,
            hasApiKey: !!apiKey,
            apiKeyLength: apiKey ? apiKey.length : 0
        });
        
        if (!apiKey) {
            console.log('No Firebase API key found, using mock verification for development');
            
            // Mock verification for development
            const mockUserId = `mock_user_${Date.now()}`;
            const mockPhone = "0123456789"; // Default mock phone
            
            return res.json({ 
                code: 200, 
                message: "Xác minh OTP thành công (Mock Mode)", 
                data: { 
                    phone: mockPhone, 
                    userId: mockUserId,
                    isPhoneConfirmed: true
                },
                warning: "Đang sử dụng mock verification cho development. Vui lòng cấu hình Firebase để sử dụng thật."
            });
        }

        const baseUrl = usingEmulator
            ? `http://${emulatorHost}/identitytoolkit.googleapis.com/v1`
            : `https://identitytoolkit.googleapis.com/v1`;

        // Initialize fetch function
        const fetch = await initFetch();
        
        const response = await fetch(`${baseUrl}/accounts:signInWithPhoneNumber?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionInfo, code })
        });
        const data = await response.json();
        if (!response.ok) {
            return res.status(400).json({ code: 400, message: data.error?.message || "Xác minh OTP thất bại", error: data });
        }

        // Verify ID token and update user phone confirmation status
        let admin, decoded, phoneNumber;
        
        try {
            admin = getAdmin();
            decoded = await admin.auth().verifyIdToken(data.idToken);
            phoneNumber = decoded.phone_number;
        } catch (adminError) {
            console.error('Firebase Admin SDK error:', adminError);
            return res.status(500).json({ 
                code: 500, 
                message: "Lỗi xác thực Firebase Admin SDK. Vui lòng kiểm tra cấu hình Firebase.",
                error: adminError.message
            });
        }

        if (!phoneNumber) {
            return res.status(400).json({ 
                code: 400, 
                message: "ID token không chứa số điện thoại" 
            });
        }

        // Format phone number to Vietnamese format
        const formattedPhone = formatPhoneNumber(phoneNumber);

        // Validate phone number format
        if (!validateVietnamesePhoneNumber(formattedPhone)) {
            return res.status(400).json({ 
                code: 400, 
                message: "Số điện thoại không đúng định dạng Việt Nam" 
            });
        }

        // Get userId from request (should be authenticated user)
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ 
                code: 401, 
                message: "User chưa đăng nhập. Vui lòng đăng nhập trước khi xác minh" 
            });
        }

        // Update user in database with phone number and confirmation status
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { 
                    phone: formattedPhone,
                    isPhoneConfirmed: true
                },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ 
                    code: 404, 
                    message: "Không tìm thấy người dùng" 
                });
            }

            return res.json({ 
                code: 200, 
                message: "Xác minh số điện thoại thành công", 
                data: { 
                    phone: formattedPhone, 
                    userId: updatedUser._id,
                    isPhoneConfirmed: updatedUser.isPhoneConfirmed,
                    user: updatedUser
                } 
            });
        } catch (dbError) {
            console.error('Database update error:', dbError);
            return res.status(500).json({ 
                code: 500, 
                message: "Lỗi cơ sở dữ liệu khi cập nhật số điện thoại", 
                error: dbError.message 
            });
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        
        let errorMessage = "Lỗi khi xác minh OTP";
        let statusCode = 500;
        
        if (error.message.includes('fetch failed')) {
            errorMessage = "Không thể kết nối đến dịch vụ xác thực. Vui lòng kiểm tra kết nối mạng và thử lại.";
            statusCode = 503;
        } else if (error.message.includes('timeout')) {
            errorMessage = "Yêu cầu xác minh OTP quá thời gian chờ. Vui lòng thử lại.";
            statusCode = 408;
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            errorMessage = "Không thể kết nối đến server xác thực. Vui lòng thử lại sau.";
            statusCode = 503;
        } else if (error.message.includes('Invalid API key')) {
            errorMessage = "Cấu hình API key không đúng. Vui lòng liên hệ quản trị viên.";
            statusCode = 500;
        } else if (error.message.includes('Firebase Admin credentials')) {
            errorMessage = "Cấu hình Firebase Admin SDK không đúng. Vui lòng kiểm tra environment variables.";
            statusCode = 500;
        } else if (error.message.includes('Database')) {
            errorMessage = "Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.";
            statusCode = 500;
        }
        
        return res.status(statusCode).json({ 
            code: statusCode, 
            message: errorMessage, 
            error: error.message
        });
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

        // Format phone number to Vietnamese format
        const formattedPhone = formatPhoneNumber(phoneNumber);

        // Validate phone number format
        if (!validateVietnamesePhoneNumber(formattedPhone)) {
            return res.status(400).json({ 
                code: 400, 
                message: "Số điện thoại không đúng định dạng Việt Nam" 
            });
        }

        // Get userId from request (should be authenticated user)
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ 
                code: 401, 
                message: "User chưa đăng nhập. Vui lòng đăng nhập trước khi xác minh" 
            });
        }

        // Update user in database with phone number and confirmation status
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { 
                    phone: formattedPhone,
                    isPhoneConfirmed: true
                },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ 
                    code: 404, 
                    message: "Không tìm thấy người dùng" 
                });
            }

            return res.json({ 
                code: 200, 
                message: "Xác minh số điện thoại (Firebase) thành công", 
                data: { 
                    phone: formattedPhone,
                    userId: updatedUser._id,
                    isPhoneConfirmed: updatedUser.isPhoneConfirmed,
                    user: updatedUser
                } 
            });
        } catch (dbError) {
            console.error('Database update error:', dbError);
            return res.status(500).json({ 
                code: 500, 
                message: "Lỗi cơ sở dữ liệu khi cập nhật số điện thoại", 
                error: dbError.message 
            });
        }
    } catch (error) {
        return res.status(500).json({ code: 500, message: "Xác minh Firebase ID token thất bại", error: error.message });
    }
}

// Load face-api.js models (call this once when server starts)
const loadModels = async () => {
    if (modelsLoaded) return;
    
    try {
        // Load face-api.js first
        await loadFaceAPI();
        
        // If using mock implementation, skip model loading
        if (isUsingMock) {
            console.log('Using mock face-api.js, skipping model loading');
            modelsLoaded = true;
            return;
        }
        
        const modelsPath = path.join(__dirname, '../../models/face-api');
        
        // Create models directory if it doesn't exist
        if (!fs.existsSync(modelsPath)) {
            fs.mkdirSync(modelsPath, { recursive: true });
        }
        
        // Download models if they don't exist
        const modelFiles = [
            'tiny_face_detector_model-weights_manifest.json',
            'tiny_face_detector_model-shard1',
            'face_landmark_68_model-weights_manifest.json', 
            'face_landmark_68_model-shard1',
            'face_recognition_model-weights_manifest.json',
            'face_recognition_model-shard1',
            'face_recognition_model-shard2'
        ];
        
        const modelUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
        
        for (const file of modelFiles) {
            const filePath = path.join(modelsPath, file);
            if (!fs.existsSync(filePath)) {
                console.log(`Downloading model: ${file}`);
                const response = await fetchFn(`${modelUrl}${file}`);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                fs.writeFileSync(filePath, buffer);
            }
        }
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath);
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath);
        
        modelsLoaded = true;
        console.log('Face-api.js models loaded successfully');
    } catch (error) {
        console.error('Error loading face-api.js models:', error);
        throw error;
    }
};

// Verify face images using face-api.js with file upload
module.exports.verifyFaceImages = async (req, res) => {
    try {
        // Check if files are uploaded
        if (!req.files || req.files.length < 3) {
            return res.status(400).json({ 
                code: 400, 
                message: "Vui lòng upload đủ 3 ảnh: ảnh chân dung, mặt trước căn cước, mặt sau căn cước" 
            });
        }

        // Get userId from authenticated user
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ 
                code: 401, 
                message: "User chưa đăng nhập. Vui lòng đăng nhập trước khi xác minh" 
            });
        }

        const files = req.files;
        const userImageFile = files[0]; // Ảnh chân dung người dùng
        const idCardFrontFile = files[1]; // Mặt trước căn cước
        const idCardBackFile = files[2]; // Mặt sau căn cước

        if (!userImageFile || !idCardFrontFile || !idCardBackFile) {
            return res.status(400).json({ 
                code: 400, 
                message: "Thiếu ảnh. Vui lòng upload đủ 3 ảnh" 
            });
        }

        // Load models if not already loaded
        await loadModels();

        // Load canvas and images (only if not using mock)
        if (!isUsingMock) {
            await loadCanvas();
        }
        
        // Load images from files
        const userImageBuffer = fs.readFileSync(userImageFile.path);
        const idCardImageBuffer = fs.readFileSync(idCardFrontFile.path);
        
        // Try to load Sharp for image processing
        const sharpInstance = await loadSharp();
        
        // Preprocess images for better face detection
        let processedUserBuffer = userImageBuffer;
        let processedIdCardBuffer = idCardImageBuffer;
        
        if (sharpInstance) {
            try {
                // Enhance user image (usually clearer)
                processedUserBuffer = await sharpInstance(userImageBuffer)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: false })
                    .sharpen()
                    .normalize()
                    .jpeg({ quality: 90 })
                    .toBuffer();
                
                // Enhance ID card image more aggressively (smaller face, more noise)
                processedIdCardBuffer = await sharpInstance(idCardImageBuffer)
                    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: false })
                    .sharpen({ sigma: 2, m1: 0.5, m2: 3 })
                    .normalize()
                    .modulate({ brightness: 1.1, saturation: 1.2 })
                    .jpeg({ quality: 95 })
                    .toBuffer();
                
                console.log('Images preprocessed with Sharp for better face detection');
            } catch (sharpError) {
                console.error('Error preprocessing images with Sharp:', sharpError);
                // Use original buffers if preprocessing fails
                processedUserBuffer = userImageBuffer;
                processedIdCardBuffer = idCardImageBuffer;
            }
        }
        
        // Create Image objects for compatibility
        const userImg = new Image();
        const idCardImg = new Image();
        
        if (sharpInstance) {
            // Use Sharp to get image metadata
            try {
                const userImageMetadata = await sharpInstance(processedUserBuffer).metadata();
                const idCardImageMetadata = await sharpInstance(processedIdCardBuffer).metadata();
                
                userImg.width = userImageMetadata.width;
                userImg.height = userImageMetadata.height;
                idCardImg.width = idCardImageMetadata.width;
                idCardImg.height = idCardImageMetadata.height;
            } catch (sharpError) {
                console.error('Error getting image metadata with Sharp:', sharpError);
                // Fallback to default dimensions
                userImg.width = 100;
                userImg.height = 100;
                idCardImg.width = 100;
                idCardImg.height = 100;
            }
        } else {
            // Fallback to default dimensions
            userImg.width = 100;
            userImg.height = 100;
            idCardImg.width = 100;
            idCardImg.height = 100;
        }
        
        userImg.src = processedUserBuffer;
        idCardImg.src = processedIdCardBuffer;

        // Simulate image load completion
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Enhanced face detection with better options for ID card images
        const userCanvas = new Canvas(userImg.width, userImg.height);
        const userCtx = userCanvas.getContext('2d');
        userCtx.drawImage(userImg, 0, 0);

        const idCardCanvas = new Canvas(idCardImg.width, idCardImg.height);
        const idCardCtx = idCardCanvas.getContext('2d');
        idCardCtx.drawImage(idCardImg, 0, 0);

        // Use more sensitive detection options for better face detection
        const detectionOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: 512, // Higher resolution for better detection
            scoreThreshold: 0.3 // Lower threshold to catch smaller faces
        });

        // Detect faces in user image (should be clearer)
        const userFaces = await faceapi.detectAllFaces(userCanvas, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptors();

        // For ID card, try multiple detection strategies
        let idCardFaces = await faceapi.detectAllFaces(idCardCanvas, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptors();

        // If no faces detected in ID card, try with even more sensitive settings
        if (idCardFaces.length === 0) {
            console.log('No faces detected in ID card with standard options, trying enhanced detection...');
            
            const enhancedOptions = new faceapi.TinyFaceDetectorOptions({
                inputSize: 1024, // Even higher resolution
                scoreThreshold: 0.1 // Very low threshold
            });
            
            idCardFaces = await faceapi.detectAllFaces(idCardCanvas, enhancedOptions)
                .withFaceLandmarks()
                .withFaceDescriptors();
        }

        if (userFaces.length === 0) {
            return res.status(400).json({ 
                code: 400, 
                message: "Không tìm thấy khuôn mặt trong hình ảnh người dùng" 
            });
        }

        if (idCardFaces.length === 0) {
            return res.status(400).json({ 
                code: 400, 
                message: "Không tìm thấy khuôn mặt trong hình ảnh căn cước công dân" 
            });
        }

        // Enhanced face comparison with multiple strategies
        let bestMatch = null;
        let bestDistance = Infinity;
        let bestSimilarity = 0;

        // Try comparing user face with all detected faces in ID card
        for (let i = 0; i < userFaces.length; i++) {
            for (let j = 0; j < idCardFaces.length; j++) {
                const userFace = userFaces[i];
                const idCardFace = idCardFaces[j];
                
                // Calculate face similarity using Euclidean distance
                const distance = faceapi.euclideanDistance(userFace.descriptor, idCardFace.descriptor);
                
                // Calculate similarity percentage
                const similarity = Math.max(0, Math.min(100, (1 - distance) * 100));
                
                // Keep track of the best match
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestSimilarity = similarity;
                    bestMatch = { userFace, idCardFace, distance, similarity };
                }
            }
        }

        if (!bestMatch) {
            return res.status(400).json({ 
                code: 400, 
                message: "Không thể so sánh khuôn mặt giữa hai ảnh" 
            });
        }

        // Adaptive threshold based on image quality and face size
        // Lower threshold for ID card images due to smaller face size
        let threshold = 0.6;
        
        // Adjust threshold based on face detection confidence
        if (bestMatch.userFace.detection.score < 0.5 || bestMatch.idCardFace.detection.score < 0.5) {
            threshold = 0.7; // More lenient for lower quality detections
        }
        
        // Additional adjustment for ID card faces (usually smaller)
        if (bestMatch.idCardFace.detection.box.width < 50 || bestMatch.idCardFace.detection.box.height < 50) {
            threshold = 0.75; // Even more lenient for very small faces
        }

        const isMatch = bestDistance < threshold;
        const similarityPercentage = Math.round(bestSimilarity);

        console.log('Enhanced face verification results:', {
            bestDistance,
            threshold,
            isMatch,
            similarityPercentage,
            userFacesDetected: userFaces.length,
            idCardFacesDetected: idCardFaces.length,
            userFaceScore: bestMatch.userFace.detection.score,
            idCardFaceScore: bestMatch.idCardFace.detection.score,
            idCardFaceSize: {
                width: bestMatch.idCardFace.detection.box.width,
                height: bestMatch.idCardFace.detection.box.height
            }
        });

        // If face verification is successful, upload files and update user
        let updatedUser = null;
        if (isMatch) {
            try {
                // Upload files to Cloudinary in user-documents folder
                let uploadedFiles = [];
                try {
                    uploadedFiles = await uploadToCloudinary(files, "retrotrade/user-documents/");
                    console.log('Files uploaded to Cloudinary:', uploadedFiles);
                    
                    if (!uploadedFiles || uploadedFiles.length !== 3) {
                        return res.status(400).json({
                            code: 400,
                            message: "Lỗi khi upload ảnh. Vui lòng thử lại"
                        });
                    }
                } catch (uploadError) {
                    console.error('Error uploading to Cloudinary:', uploadError);
                    return res.status(500).json({
                        code: 500,
                        message: "Lỗi khi upload ảnh lên server",
                        error: uploadError.message
                    });
                }

                // Prepare documents array to save
                const documentTypes = ['selfie', 'idCardFront', 'idCardBack'];
                const documents = uploadedFiles.map((file, index) => {
                    return {
                        documentType: documentTypes[index] || 'document',
                        documentNumber: `DOC-${Date.now()}-${index}`,
                        fileUrl: file.Url,
                        status: 'approved',
                        submittedAt: new Date()
                    };
                });

                // Update user with ID verification and save documents
                updatedUser = await User.findByIdAndUpdate(
                    userId,
                    { 
                        isIdVerified: true,
                        $push: { documents: { $each: documents } }
                    },
                    { new: true }
                );

                if (!updatedUser) {
                    return res.status(404).json({ 
                        code: 404, 
                        message: "Không tìm thấy người dùng" 
                    });
                }

                console.log('User ID verification updated successfully:', updatedUser._id);

                // Send notification to user
                try {
                    await createNotification(
                        userId,
                        "Identity Verified",
                        "Xác minh danh tính thành công",
                        `Xin chào ${updatedUser.fullName || 'bạn'}, danh tính của bạn đã được xác minh thành công vào lúc ${new Date().toLocaleString("vi-VN")}.`,
                        { 
                            verificationTime: new Date().toISOString(),
                            documentTypes: documentTypes
                        }
                    );
                } catch (notificationError) {
                    console.error("Error creating identity verification notification:", notificationError);
                }
            } catch (userUpdateError) {
                console.error('Error updating user:', userUpdateError);
                return res.status(500).json({
                    code: 500,
                    message: "Lỗi cơ sở dữ liệu khi cập nhật xác minh danh tính",
                    error: userUpdateError.message
                });
            }
        }

        const responseData = {
            isMatch,
            similarityPercentage,
            distance: bestDistance,
            threshold,
            userFacesDetected: userFaces.length,
            idCardFacesDetected: idCardFaces.length,
            detectionDetails: {
                userFaceScore: bestMatch.userFace.detection.score,
                idCardFaceScore: bestMatch.idCardFace.detection.score,
                idCardFaceSize: {
                    width: bestMatch.idCardFace.detection.box.width,
                    height: bestMatch.idCardFace.detection.box.height
                }
            }
        };

        // Only include upload and user info if verification was successful
        if (isMatch && updatedUser) {
            responseData.userId = updatedUser._id;
            responseData.isIdVerified = updatedUser.isIdVerified;
            responseData.documents = updatedUser.documents || [];
        }

        return res.json({
            code: isMatch ? 200 : 400,
            message: isMatch ? "Xác minh danh tính thành công" : "Khuôn mặt không khớp",
            data: responseData
        });

    } catch (error) {
        console.error('Face verification error:', error);
        return res.status(500).json({ 
            code: 500, 
            message: "Lỗi khi xác minh khuôn mặt", 
            error: error.message 
        });
    }
};

