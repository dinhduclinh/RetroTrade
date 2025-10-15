// Password validation utilities

export type PasswordValidationResult = {
  isValid: boolean
  message?: string
}

// Rules: at least 8 chars, contains a letter, a number, and a special character
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

export function validatePassword(password: string): PasswordValidationResult {
  if (typeof password !== "string" || password.length === 0) {
    return { isValid: false, message: "Mật khẩu không được để trống." }
  }

  if (password.length < 8) {
    return { isValid: false, message: "Mật khẩu phải có ít nhất 8 ký tự." }
  }

  if (!/[A-Za-z]/.test(password)) {
    return { isValid: false, message: "Mật khẩu phải chứa ít nhất một chữ cái." }
  }

  if (!/\d/.test(password)) {
    return { isValid: false, message: "Mật khẩu phải chứa ít nhất một chữ số." }
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, message: "Mật khẩu phải chứa ít nhất một ký tự đặc biệt." }
  }

  if (!PASSWORD_REGEX.test(password)) {
    return { isValid: false, message: "Mật khẩu chưa đáp ứng đủ yêu cầu." }
  }

  return { isValid: true }
}


