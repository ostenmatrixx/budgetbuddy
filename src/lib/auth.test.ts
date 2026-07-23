import { describe, expect, it } from "vitest";
import { validateAuthInput, validateNewPassword } from "./auth";

describe("validateAuthInput", () => {
  it("requires a valid email and password for sign in", () => {
    expect(validateAuthInput("signin", "not-email", "")).toEqual({
      isValid: false,
      errors: {
        email: "Enter a valid email address.",
        password: "Enter your password."
      }
    });
  });

  it("requires a longer password for sign up", () => {
    expect(validateAuthInput("signup", "owner@example.com", "short")).toEqual({
      isValid: false,
      errors: {
        password: "Use at least 10 characters."
      }
    });
  });

  it("normalizes valid auth input", () => {
    expect(validateAuthInput("signup", " Owner@Example.com ", "password123")).toEqual({
      isValid: true,
      errors: {},
      value: {
        email: "owner@example.com",
        password: "password123"
      }
    });
  });

  it("preserves password whitespace exactly", () => {
    expect(validateAuthInput("signin", "Owner@Example.com", " pass phrase ")).toEqual({
      isValid: true,
      errors: {},
      value: {
        email: "owner@example.com",
        password: " pass phrase "
      }
    });
  });
});

describe("validateNewPassword", () => {
  it("requires a ten-character matching password", () => {
    expect(validateNewPassword("short", "different")).toEqual({
      isValid: false,
      errors: {
        password: "Use at least 10 characters.",
        confirmation: "Passwords do not match."
      }
    });
  });

  it("does not normalize the new password", () => {
    expect(validateNewPassword(" space pass ", " space pass ")).toEqual({
      isValid: true,
      errors: {},
      value: " space pass "
    });
  });
});
