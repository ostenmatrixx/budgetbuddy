import { describe, expect, it } from "vitest";
import { validateAuthInput } from "./auth";

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
        password: "Use at least 8 characters."
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
});
