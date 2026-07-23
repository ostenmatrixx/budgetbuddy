export type AuthMode = "signin" | "signup";

export const MINIMUM_PASSWORD_LENGTH = 10;

export interface AuthInputErrors {
  email?: string;
  password?: string;
}

export interface AuthInputResult {
  isValid: boolean;
  errors: AuthInputErrors;
  value?: {
    email: string;
    password: string;
  };
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthInput(
  mode: AuthMode,
  email: string,
  password: string
): AuthInputResult {
  const normalizedEmail = email.trim().toLowerCase();
  // Passwords are opaque credentials. Never trim or otherwise normalize them.
  const nextPassword = password;
  const errors: AuthInputErrors = {};

  if (!emailPattern.test(normalizedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!nextPassword) {
    errors.password = "Enter your password.";
  } else if (mode === "signup" && nextPassword.length < MINIMUM_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MINIMUM_PASSWORD_LENGTH} characters.`;
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: {},
    value: {
      email: normalizedEmail,
      password: nextPassword
    }
  };
}

export interface PasswordInputErrors {
  password?: string;
  confirmation?: string;
}

export interface PasswordInputResult {
  isValid: boolean;
  errors: PasswordInputErrors;
  value?: string;
}

export function validateNewPassword(password: string, confirmation: string): PasswordInputResult {
  const errors: PasswordInputErrors = {};

  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MINIMUM_PASSWORD_LENGTH} characters.`;
  }

  if (confirmation !== password) {
    errors.confirmation = "Passwords do not match.";
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, errors: {}, value: password };
}
