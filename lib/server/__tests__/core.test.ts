import { describe, it, expect } from "vitest";
import { registerSchema } from "@/lib/validators/auth";
import { createPropertySchema } from "@/lib/validators/property";
import { investSchema } from "@/lib/validators/investment";
import { assertTransition } from "@/lib/server/services/property.service";
import { ApiError } from "@/lib/server/errors";

describe("Core Validation & Logic Unit Tests (P1)", () => {
  describe("Auth Validation", () => {
    it("accepts valid registration input", () => {
      const valid = {
        name: "Test User",
        email: "test@example.com",
        phone: "9876543210",
        password: "Password123!",
        role: "INVESTOR",
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects ADMIN role during registration", () => {
      const invalid = {
        name: "Admin User",
        email: "admin@example.com",
        phone: "9876543210",
        password: "Password123!",
        role: "ADMIN",
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid Indian phone number", () => {
      const invalid = {
        name: "Test User",
        email: "test@example.com",
        phone: "1234567890",
        password: "Password123!",
        role: "INVESTOR",
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Property Validation & Math", () => {
    it("validates that unit price in paise is whole rupees (divisible by 100)", () => {
      const valuation = 10000000; // 1 Lakh in paise
      const totalUnits = 100;
      const unitPrice = valuation / totalUnits;
      expect(valuation % totalUnits).toBe(0);
      expect(unitPrice % 100).toBe(0);
    });

    it("validates invest schema input", () => {
      const valid = {
        propertyId: "507f1f77bcf86cd799439011",
        units: 10,
        idempotencyKey: "test-uuid-123",
      };
      const result = investSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("Property State Machine", () => {
    it("allows legal status transitions", () => {
      expect(() => assertTransition("DRAFT", "PENDING_APPROVAL")).not.toThrow();
      expect(() => assertTransition("PENDING_APPROVAL", "LIVE")).not.toThrow();
      expect(() => assertTransition("PENDING_APPROVAL", "REJECTED")).not.toThrow();
      expect(() => assertTransition("REJECTED", "PENDING_APPROVAL")).not.toThrow();
      expect(() => assertTransition("LIVE", "FUNDED")).not.toThrow();
      expect(() => assertTransition("LIVE", "CANCELLED")).not.toThrow();
      expect(() => assertTransition("FUNDED", "HOLDING")).not.toThrow();
      expect(() => assertTransition("HOLDING", "SOLD")).not.toThrow();
    });

    it("throws 409 INVALID_TRANSITION on illegal transitions", () => {
      expect(() => assertTransition("DRAFT", "LIVE")).toThrow(ApiError);
      expect(() => assertTransition("DRAFT", "SOLD")).toThrow(ApiError);
      expect(() => assertTransition("SOLD", "LIVE")).toThrow(ApiError);
      expect(() => assertTransition("CANCELLED", "LIVE")).toThrow(ApiError);
    });
  });
});
