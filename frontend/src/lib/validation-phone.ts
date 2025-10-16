// Vietnamese phone number validation utilities

export type PhoneValidationResult = {
  isValid: boolean
  message?: string
}

// Vietnamese phone number patterns:
// Mobile: 03x, 05x, 07x, 08x, 09x (10 digits)
// Landline: 02x (10-11 digits for Hanoi/HCMC)
// Common formats: 03xx xxx xxx, 05xx xxx xxx, etc.
const VIETNAMESE_PHONE_REGEX = /^(0[3|5|7|8|9])([0-9]{8})$|^(02[0-9])([0-9]{7,8})$/

export function validatePhone(phone: string): PhoneValidationResult {
  if (typeof phone !== "string" || phone.length === 0) {
    return { isValid: false, message: "Số điện thoại không được để trống." }
  }

  // Remove all spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "")

  // Check if contains only digits
  if (!/^\d+$/.test(cleanPhone)) {
    return { isValid: false, message: "Số điện thoại chỉ được chứa chữ số." }
  }

  // Check length (10-11 digits)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { isValid: false, message: "Số điện thoại phải có 10-11 chữ số." }
  }

  // Check Vietnamese phone number format
  if (!VIETNAMESE_PHONE_REGEX.test(cleanPhone)) {
    return { isValid: false, message: "Số điện thoại không đúng định dạng Việt Nam." }
  }

  return { isValid: true }
}

// Format phone number for display (add spaces for readability)
export function formatPhone(phone: string): string {
  if (typeof phone !== "string") return ""
  
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "")
  
  if (cleanPhone.length === 10) {
    // Mobile format: 03xx xxx xxx
    return cleanPhone.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")
  } else if (cleanPhone.length === 11) {
    // Landline format: 02xx xxx xxxx
    return cleanPhone.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3")
  }
  
  return phone
}

// Get phone carrier information
export function getPhoneCarrier(phone: string): string {
  if (typeof phone !== "string") return ""
  
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "")
  
  if (cleanPhone.startsWith("032") || cleanPhone.startsWith("033") || cleanPhone.startsWith("034") || cleanPhone.startsWith("035") || cleanPhone.startsWith("036") || cleanPhone.startsWith("037") || cleanPhone.startsWith("038") || cleanPhone.startsWith("039")) {
    return "Viettel"
  } else if (cleanPhone.startsWith("070") || cleanPhone.startsWith("076") || cleanPhone.startsWith("077") || cleanPhone.startsWith("078") || cleanPhone.startsWith("079")) {
    return "Mobifone"
  } else if (cleanPhone.startsWith("081") || cleanPhone.startsWith("082") || cleanPhone.startsWith("083") || cleanPhone.startsWith("084") || cleanPhone.startsWith("085")) {
    return "Vinaphone"
  } else if (cleanPhone.startsWith("056") || cleanPhone.startsWith("058")) {
    return "Vietnamobile"
  } else if (cleanPhone.startsWith("059")) {
    return "Gmobile"
  } else if (cleanPhone.startsWith("02")) {
    return "Landline"
  }
  
  return "Unknown"
}
