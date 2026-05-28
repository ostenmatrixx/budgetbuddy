export type AuthMode = "signin" | "signup";

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
  const nextPassword = password.trim();
  const errors: AuthInputErrors = {};

  if (!emailPattern.test(normalizedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!nextPassword) {
    errors.password = "Enter your password.";
  } else if (mode === "signup" && nextPassword.length < 8) {
    errors.password = "Use at least 8 characters.";
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
