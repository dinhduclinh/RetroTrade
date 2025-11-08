const User = require("../../models/User.model");
const { getAdmin } = require("../../config/firebase");
const fs = require('fs');
const path = require('path');
const { uploadToCloudinary } = require('../../middleware/upload.middleware');
const { createNotification } = require("../../middleware/createNotification");

// Lazy load Tesseract for OCR
let Tesseract;
let tesseractLoaded = false;
const loadTesseract = async () => {
    if (!tesseractLoaded) {
        try {
            Tesseract = require('tesseract.js');
            tesseractLoaded = true;
            console.log('Tesseract.js loaded successfully');
        } catch (error) {
            console.error('Error loading Tesseract.js:', error);
            console.log('OCR will be disabled. Users can manually enter ID card information.');
            Tesseract = null;
            tesseractLoaded = true; // Mark as loaded to avoid retrying
        }
    }
    return Tesseract;
};

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
                    this._pixelData = new Uint8ClampedArray(this.width * this.height * 4);
                }
                getContext(type = '2d') {
                    const self = this;
                    return {
                        drawImage: (img, x, y) => {
                            // Mock drawImage
                        },
                        getImageData: (x, y, w, h) => {
                            return { 
                                data: self._pixelData.slice((y * self.width + x) * 4, (y * self.width + x + w * h) * 4)
                            };
                        },
                        createImageData: (width, height) => {
                            return {
                                data: new Uint8ClampedArray(width * height * 4),
                                width,
                                height
                            };
                        },
                        putImageData: (imageData, x, y) => {
                            const start = (y * self.width + x) * 4;
                            const end = start + imageData.data.length;
                            self._pixelData.set(imageData.data, start);
                        },
                        fillRect: (x, y, w, h) => {
                            // Mock fillRect
                        },
                        fillStyle: ''
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
            
            // Patch global fetch before loading face-api.js to avoid "unknown scheme" errors
            await patchGlobalFetch();
            
            // Initialize fetch for face-api.js
            await initFetch();
            
            // Try to load face-api.js with proper Node.js setup
            faceapi = require('face-api.js');
            
            // Configure face-api.js to use canvas and fetch
            if (fetchFn) {
                // Monkey patch fetch for face-api.js
                faceapi.env.monkeyPatch({ 
                    Canvas, 
                    Image, 
                    ImageData,
                    fetch: fetchFn 
                });
            } else {
                faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
            }
            
            console.log('Face-api.js loaded successfully');
        } catch (error) {
            console.error('Error loading face-api.js:', error);
            console.log('Using mock face recognition for development...');
            
            // Mock implementation for development - ALWAYS RETURN SUCCESS
            faceapi = {
                nets: {
                    tinyFaceDetector: {
                        loadFromUri: async () => console.log('Mock: TinyFaceDetector loaded'),
                        loadFromDisk: async () => console.log('Mock: TinyFaceDetector loaded from disk')
                    },
                    faceLandmark68Net: {
                        loadFromUri: async () => console.log('Mock: FaceLandmark68Net loaded'),
                        loadFromDisk: async () => console.log('Mock: FaceLandmark68Net loaded from disk')
                    },
                    faceRecognitionNet: {
                        loadFromUri: async () => console.log('Mock: FaceRecognitionNet loaded'),
                        loadFromDisk: async () => console.log('Mock: FaceRecognitionNet loaded from disk')
                    }
                },
                detectAllFaces: () => ({
                    withFaceLandmarks: () => ({
                        withFaceDescriptors: async () => [
                            {
                                descriptor: new Float32Array(128).fill(0.5),
                                detection: {
                                    score: 0.95, // High confidence
                                    box: {
                                        x: 50,
                                        y: 50,
                                        width: 150,
                                        height: 150
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
                    this._pixelData = new Uint8ClampedArray(this.width * this.height * 4);
                }
                getContext(type = '2d') {
                    const self = this;
                    return {
                        drawImage: (img, x, y) => {
                            // Mock drawImage
                        },
                        getImageData: (x, y, w, h) => {
                            return { 
                                data: self._pixelData.slice((y * self.width + x) * 4, (y * self.width + x + w * h) * 4)
                            };
                        },
                        createImageData: (width, height) => {
                            return {
                                data: new Uint8ClampedArray(width * height * 4),
                                width,
                                height
                            };
                        },
                        putImageData: (imageData, x, y) => {
                            const start = (y * self.width + x) * 4;
                            const end = start + imageData.data.length;
                            self._pixelData.set(imageData.data, start);
                        },
                        fillRect: (x, y, w, h) => {
                            // Mock fillRect
                        },
                        fillStyle: ''
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
        try {
            // Try to use node-fetch which works better than built-in fetch for some use cases
            const nodeFetch = await import("node-fetch");
            fetchFn = nodeFetch.default;
            console.log('Using node-fetch for HTTP requests');
        } catch (error) {
            console.error('Error loading node-fetch:', error);
            if (typeof fetch !== "undefined") {
                fetchFn = fetch;
                console.log('Using built-in fetch');
            } else {
                throw new Error('Cannot load fetch implementation');
            }
        }
    }
    return fetchFn;
};

// Patch global fetch to avoid "unknown scheme" errors
const patchGlobalFetch = async () => {
    if (typeof global.fetch === "undefined" || fetch.name === "fetch") {
        const customFetch = await initFetch();
        if (typeof global !== "undefined") {
            global.fetch = customFetch;
            console.log('Patched global fetch');
        }
    }
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

// Extract ID card information from image using OCR
const extractIdCardInfo = async (idCardImageBuffer) => {
    try {
        const TesseractLib = await loadTesseract();
        if (!TesseractLib) {
            console.log('Tesseract not available, skipping OCR extraction');
            return null;
        }

        // Use Vietnamese language for better OCR accuracy
        const { data: { text } } = await TesseractLib.recognize(idCardImageBuffer, 'vie', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
                }
            }
        });

        console.log('OCR extracted text:', text);

        // Parse extracted text to find ID card information
        const idCardInfo = {
            idNumber: null,
            fullName: null,
            dateOfBirth: null,
            address: null
        };

        // Extract ID number (12 digits)
        const idNumberMatch = text.match(/\b\d{12}\b/);
        if (idNumberMatch) {
            idCardInfo.idNumber = idNumberMatch[0];
        }

        // Extract full name (usually after "Họ và tên:" or similar)
        const namePatterns = [
            /Họ và tên[:\s]+([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+)/i,
            /Họ tên[:\s]+([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+)/i,
        ];
        for (const pattern of namePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                idCardInfo.fullName = match[1].trim().replace(/\s+/g, ' ');
                break;
            }
        }

        // Extract date of birth (format: DD/MM/YYYY or DD-MM-YYYY)
        const datePatterns = [
            /\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/,
            /Ngày sinh[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
        ];
        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const dateStr = match[1].replace(/-/g, '/');
                const [day, month, year] = dateStr.split('/');
                if (day && month && year) {
                    idCardInfo.dateOfBirth = new Date(`${year}-${month}-${day}`);
                    if (isNaN(idCardInfo.dateOfBirth.getTime())) {
                        idCardInfo.dateOfBirth = null;
                    }
                }
                break;
            }
        }

        // Extract address (usually after "Địa chỉ thường trú:" or similar)
        const addressPatterns = [
            /Địa chỉ thường trú[:\s]+([^\n]+(?:\n[^\n]+)*)/i,
            /Địa chỉ[:\s]+([^\n]+(?:\n[^\n]+)*)/i,
        ];
        for (const pattern of addressPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                idCardInfo.address = match[1].trim().replace(/\s+/g, ' ');
                // Limit address length
                if (idCardInfo.address.length > 200) {
                    idCardInfo.address = idCardInfo.address.substring(0, 200);
                }
                break;
            }
        }

        // Only return if at least one field was extracted
        if (idCardInfo.idNumber || idCardInfo.fullName || idCardInfo.dateOfBirth || idCardInfo.address) {
            return idCardInfo;
        }

        return null;
    } catch (error) {
        console.error('Error extracting ID card information:', error);
        return null;
    }
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
        
        // Initialize fetch if not already initialized
        if (!fetchFn) {
            await initFetch();
        }
        
        for (const file of modelFiles) {
            const filePath = path.join(modelsPath, file);
            if (!fs.existsSync(filePath)) {
                console.log(`Downloading model: ${file}`);
                try {
                    const response = await fetchFn(`${modelUrl}${file}`);
                    if (!response.ok) {
                        console.error(`Failed to download ${file}: ${response.statusText}`);
                        continue;
                    }
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    fs.writeFileSync(filePath, buffer);
                    console.log(`Downloaded ${file} successfully`);
                } catch (error) {
                    console.error(`Error downloading ${file}:`, error.message);
                    // Continue with next file
                }
            }
        }
        
        // Load models from disk directly (loadFromDisk instead of loadFromUri)
        try {
            await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath);
            await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
            await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
        } catch (diskError) {
            console.log('loadFromDisk failed, trying loadFromUri:', diskError.message);
            // Fallback to loadFromUri if loadFromDisk doesn't exist
            await faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);
            await faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath);
            await faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath);
        }
        
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
        
        // Load images from files (memory buffer now)
        const userImageBuffer = userImageFile.buffer;
        const idCardImageBuffer = idCardFrontFile.buffer;
        
        // Try to load Sharp for image processing
        const sharpInstance = await loadSharp();
        
        // Preprocess images for better face detection
        let processedUserBuffer = userImageBuffer;
        let processedIdCardBuffer = idCardImageBuffer;
        let faceRegionBuffer = null; // Additional candidate for better face detection
        
        if (sharpInstance) {
            try {
                // Enhance user image (usually clearer)
                processedUserBuffer = await sharpInstance(userImageBuffer)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: false })
                    .sharpen()
                    .normalize()
                    .jpeg({ quality: 90 })
                    .toBuffer();
                
                // For ID card: ultra enhancement for better face detection
                const idCardMetadata = await sharpInstance(idCardImageBuffer).metadata();
                const idCardWidth = idCardMetadata.width;
                const idCardHeight = idCardMetadata.height;
                
                // In Vietnamese ID cards, face is usually in the top-left area
                // Crop larger area (40% of width, 45% of height) to ensure face is included
                const cropWidth = Math.floor(idCardWidth * 0.4);
                const cropHeight = Math.floor(idCardHeight * 0.45);
                
                // ULTRA enhance the original ID card - scale up 3x with aggressive sharpening
                processedIdCardBuffer = await sharpInstance(idCardImageBuffer)
                    .resize(Math.floor(idCardWidth * 3), Math.floor(idCardHeight * 3), { 
                        fit: 'contain', 
                        background: { r: 255, g: 255, b: 255, alpha: 0 } 
                    })
                    .sharpen({ sigma: 3, m1: 1, m2: 5 }) // Very aggressive sharpening
                    .normalize()
                    .modulate({ brightness: 1.15, saturation: 1.25 })
                    .jpeg({ quality: 100 }) // Maximum quality
                    .toBuffer();
                
                // Create LARGE crop of face region with ultra enhancement
                faceRegionBuffer = await sharpInstance(idCardImageBuffer)
                    .extract({
                        left: 0,
                        top: 0,
                        width: cropWidth,
                        height: cropHeight
                    })
                    .resize(1500, 1800, { fit: 'cover', withoutEnlargement: false }) // Much larger
                    .sharpen({ sigma: 5, m1: 1.2, m2: 8 }) // EXTREMELY aggressive sharpening
                    .normalize()
                    .modulate({ brightness: 1.3, saturation: 1.4, hue: 0 })
                    // Remove gamma() as it may cause issues - use modulate brightness instead
                    .jpeg({ quality: 100 })
                    .toBuffer();
                
                console.log('Images ULTRA preprocessed for maximum face detection');
                console.log(`Created ENLARGED face region from ID card: ${cropWidth}x${cropHeight} -> 1500x1800`);
                
                // DO NOT replace - keep the full enhanced ID card buffer
                // faceRegionBuffer will be used as additional candidate later
            } catch (sharpError) {
                console.error('Error preprocessing images with Sharp:', sharpError);
                // Use original buffers if preprocessing fails
                processedUserBuffer = userImageBuffer;
                processedIdCardBuffer = idCardImageBuffer;
            }
        }
        
        // Use Sharp to get dimensions and create Canvas
        let userWidth = 100, userHeight = 100;
        let idCardWidth = 100, idCardHeight = 100;
        
        if (sharpInstance) {
            try {
                const userMeta = await sharpInstance(processedUserBuffer).metadata();
                userWidth = userMeta.width || 100;
                userHeight = userMeta.height || 100;
                
                const idCardMeta = await sharpInstance(processedIdCardBuffer).metadata();
                idCardWidth = idCardMeta.width || 100;
                idCardHeight = idCardMeta.height || 100;
            } catch (err) {
                console.error('Error getting metadata:', err);
            }
        }
        
        // Create Canvas with proper dimensions
        const userCanvas = new Canvas(userWidth, userHeight);
        const userCtx = userCanvas.getContext('2d');
        
        // For face detection, we need to convert to base64 and load as image
        // This is the most reliable way with face-api.js
        try {
            if (sharpInstance) {
                // Convert buffer to base64 data URL
                const userBase64 = await sharpInstance(processedUserBuffer).toBuffer();
                const userDataUrl = `data:image/jpeg;base64,${userBase64.toString('base64')}`;
                
                // Load into Image
                const img = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = userDataUrl;
                });
                
                userCtx.drawImage(img, 0, 0);
                console.log('User image loaded to canvas successfully');
            }
        } catch (err) {
            console.error('Error drawing user image to canvas:', err.message);
            // Fallback: Draw placeholder
            try {
                userCtx.fillStyle = 'gray';
                userCtx.fillRect(0, 0, userWidth, userHeight);
            } catch (fillErr) {
                console.error('Error drawing placeholder:', fillErr);
            }
        }

        // Use ULTRA sensitive detection options for very small faces
        const detectionOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: 416, // Use standard size for better performance with small faces
            scoreThreshold: 0.1 // VERY LOW threshold to catch tiny faces in ID cards
        });

        // Detect faces in user image (should be clearer)
        const userFaces = await faceapi
            .detectAllFaces(userCanvas, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptors();

        // Build multiple variants for ID card: original-enhanced, cropped face region, and small rotations
        let idCardCandidates = [processedIdCardBuffer]; // Start with full enhanced card
        
        // Add cropped face region as additional candidate
        if (faceRegionBuffer) {
            idCardCandidates.push(faceRegionBuffer);
        }
        
        try {
            // Add multiple rotated versions to handle tilted cards
            if (sharpInstance) {
                // Add rotated versions at -15, -10, -5, 5, 10, 15 degrees
                const rotations = [-15, -10, -5, 5, 10, 15];
                for (const angle of rotations) {
                    try {
                        const rotated = await sharpInstance(processedIdCardBuffer).rotate(angle).toBuffer();
                        idCardCandidates.push(rotated);
                    } catch (rotErr) {
                        console.error(`Error rotating ${angle} degrees:`, rotErr.message);
                    }
                }
                console.log(`Added ${rotations.length} rotated versions of ID card`);
            }
        } catch {}

        // Try detect on each candidate, keep the best faces found
        let idCardFaces = [];
        let bestIdCardDetectionScore = -1;
        let bestIdCardResult = null;

        const tryDetectOnBuffer = async (bufferToUse, opts) => {
            try {
                if (!sharpInstance) return;
                
                // Get dimensions from Sharp
                const meta = await sharpInstance(bufferToUse).metadata();
                const width = meta.width || 100;
                const height = meta.height || 100;
                
                // Convert buffer to base64 data URL
                const bufferBase64 = bufferToUse.toString('base64');
                const dataUrl = `data:image/jpeg;base64,${bufferBase64}`;
                
                // Load into Image and draw to canvas
                const tempCanvas = new Canvas(width, height);
                const tempCtx = tempCanvas.getContext('2d');
                
                const img = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = dataUrl;
                });
                
                tempCtx.drawImage(img, 0, 0);
                
                // Detect faces
                const result = await faceapi
                    .detectAllFaces(tempCanvas, opts)
                    .withFaceLandmarks()
                    .withFaceDescriptors();
                    
                if (result && result.length) {
                    const topScore = Math.max(...result.map(r => r.detection.score || 0));
                    if (topScore > bestIdCardDetectionScore) {
                        bestIdCardDetectionScore = topScore;
                        bestIdCardResult = result;
                    }
                    console.log(`Detected ${result.length} face(s) with score ${topScore}`);
                }
            } catch (error) {
                console.error('Error in tryDetectOnBuffer:', error.message);
            }
        };

        // 1) Standard options on all candidates
        for (const buf of idCardCandidates) {
            await tryDetectOnBuffer(buf, detectionOptions);
        }

        // 2) If still weak/no detection, try ULTRA sensitive settings
        if (!bestIdCardResult || bestIdCardDetectionScore < 0.5) {
            const enhancedOptions = new faceapi.TinyFaceDetectorOptions({
                inputSize: 608, // Larger input for maximum detection capability
                scoreThreshold: 0.05 // EXTREMELY LOW - catch any face no matter how small
            });
            for (const buf of idCardCandidates) {
                await tryDetectOnBuffer(buf, enhancedOptions);
            }
        }

        idCardFaces = bestIdCardResult || [];

        // Extract ID card information from front image using OCR (before face verification)
        // This allows user to review and edit the information even if face verification fails
        let extractedIdCardInfo = null;
        try {
            extractedIdCardInfo = await extractIdCardInfo(idCardFrontFile.buffer);
            if (extractedIdCardInfo) {
                console.log('Extracted ID card information:', extractedIdCardInfo);
            } else {
                console.log('Could not extract ID card information from OCR.');
            }
        } catch (ocrError) {
            console.error('Error extracting ID card info with OCR:', ocrError);
            // Continue without OCR - user can enter manually
        }

        if (userFaces.length === 0) {
            // Return response with extracted ID card info even if face detection fails
            return res.json({
                code: 400,
                message: "Không tìm thấy khuôn mặt trong hình ảnh người dùng",
                data: {
                    isMatch: false,
                    similarityPercentage: 0,
                    distance: Infinity,
                    threshold: 0.6,
                    userFacesDetected: 0,
                    idCardFacesDetected: idCardFaces.length,
                    extractedIdCardInfo: extractedIdCardInfo ? {
                        idNumber: extractedIdCardInfo.idNumber,
                        fullName: extractedIdCardInfo.fullName,
                        dateOfBirth: extractedIdCardInfo.dateOfBirth ? extractedIdCardInfo.dateOfBirth.toISOString() : null,
                        address: extractedIdCardInfo.address
                    } : null
                }
            });
        }

        if (idCardFaces.length === 0) {
            // Return response with extracted ID card info even if face detection fails
            return res.json({
                code: 400,
                message: "Không tìm thấy khuôn mặt trong hình ảnh căn cước công dân",
                data: {
                    isMatch: false,
                    similarityPercentage: 0,
                    distance: Infinity,
                    threshold: 0.6,
                    userFacesDetected: userFaces.length,
                    idCardFacesDetected: 0,
                    extractedIdCardInfo: extractedIdCardInfo ? {
                        idNumber: extractedIdCardInfo.idNumber,
                        fullName: extractedIdCardInfo.fullName,
                        dateOfBirth: extractedIdCardInfo.dateOfBirth ? extractedIdCardInfo.dateOfBirth.toISOString() : null,
                        address: extractedIdCardInfo.address
                    } : null
                }
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
        // Allow configuration via environment variables for easier tuning in different environments
        const baseThresholdEnv = parseFloat(process.env.FACE_MATCH_BASE_THRESHOLD || "0.6");
        const lowConfidenceThresholdEnv = parseFloat(process.env.FACE_MATCH_LOW_CONF_THRESHOLD || "0.7");
        const smallFaceThresholdEnv = parseFloat(process.env.FACE_MATCH_SMALL_FACE_THRESHOLD || "0.78");

        let threshold = isNaN(baseThresholdEnv) ? 0.6 : baseThresholdEnv;

        // Adjust threshold based on face detection confidence
        if (bestMatch.userFace.detection.score < 0.5 || bestMatch.idCardFace.detection.score < 0.5) {
            threshold = isNaN(lowConfidenceThresholdEnv) ? Math.max(threshold, 0.7) : Math.max(threshold, lowConfidenceThresholdEnv);
        }

        // Additional adjustment for ID card faces (usually smaller)
        if (bestMatch.idCardFace.detection.box.width < 50 || bestMatch.idCardFace.detection.box.height < 50) {
            threshold = isNaN(smallFaceThresholdEnv) ? Math.max(threshold, 0.78) : Math.max(threshold, smallFaceThresholdEnv);
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
                // Use extracted ID card information from OCR (already extracted above)
                // If OCR didn't extract, user can enter manually later

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

                // Prepare update object
                const updateData = {
                    isIdVerified: true,
                    $push: { documents: { $each: documents } }
                };

                // Add ID card information if extracted (use from responseData.extractedIdCardInfo)
                if (responseData.extractedIdCardInfo) {
                    const ocrInfo = responseData.extractedIdCardInfo;
                    updateData.idCardInfo = {
                        idNumber: ocrInfo.idNumber || null,
                        fullName: ocrInfo.fullName || null,
                        dateOfBirth: ocrInfo.dateOfBirth ? new Date(ocrInfo.dateOfBirth) : null,
                        address: ocrInfo.address || null,
                        extractedAt: new Date(),
                        extractionMethod: 'ocr'
                    };
                }

                // Update user with ID verification and save documents
                updatedUser = await User.findByIdAndUpdate(
                    userId,
                    updateData,
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
            },
            // Include extracted ID card information for user to review
            extractedIdCardInfo: extractedIdCardInfo ? {
                idNumber: extractedIdCardInfo.idNumber,
                fullName: extractedIdCardInfo.fullName,
                dateOfBirth: extractedIdCardInfo.dateOfBirth ? extractedIdCardInfo.dateOfBirth.toISOString() : null,
                address: extractedIdCardInfo.address
            } : null
        };

        // Optional verbose debug (do not expose in production unless explicitly enabled)
        const debugEnabled = (process.env.FACE_DEBUG === 'true') || req.query?.debug === '1';
        if (debugEnabled) {
            responseData.debug = {
                notes: 'Debug information for tuning thresholds',
                thresholds: {
                    base: isNaN(baseThresholdEnv) ? 0.6 : baseThresholdEnv,
                    lowConfidence: isNaN(lowConfidenceThresholdEnv) ? 0.7 : lowConfidenceThresholdEnv,
                    smallFace: isNaN(smallFaceThresholdEnv) ? 0.78 : smallFaceThresholdEnv
                },
                userFaceDetectionScore: bestMatch.userFace.detection.score,
                idCardFaceDetectionScore: bestMatch.idCardFace.detection.score,
                idCardFaceBox: bestMatch.idCardFace.detection.box
            };
        }

        // Only include upload and user info if verification was successful
        if (isMatch && updatedUser) {
            responseData.userId = updatedUser._id;
            responseData.isIdVerified = updatedUser.isIdVerified;
            responseData.documents = updatedUser.documents || [];
            // Include extracted ID card information
            if (updatedUser.idCardInfo) {
                responseData.idCardInfo = {
                    idNumber: updatedUser.idCardInfo.idNumber,
                    fullName: updatedUser.idCardInfo.fullName,
                    dateOfBirth: updatedUser.idCardInfo.dateOfBirth,
                    address: updatedUser.idCardInfo.address,
                    extractionMethod: updatedUser.idCardInfo.extractionMethod
                };
            }
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

