import { describe, expect, it } from "vitest";
import { safeOfficialUrl, isNormalRecommendation } from "@/lib/opportunity-source";
import { validateNewPassword } from "@/lib/password-rules";
describe("focused opportunity and recovery rules", () => {
  it("excludes demo records from normal recommendations", () => {
    expect(isNormalRecommendation({ is_demo: true, application_status: "open", deadline: null })).toBe(false);
    expect(isNormalRecommendation({ is_demo: false, application_status: "open", deadline: null })).toBe(true);
  });
  it("excludes expired and closed opportunities", () => {
    expect(isNormalRecommendation({ is_demo: false, application_status: "open", deadline: "2026-10-16" }, "2026-10-17")).toBe(false);
    expect(isNormalRecommendation({ is_demo: false, application_status: "closed", deadline: "2027-01-01" }, "2026-10-17")).toBe(false);
  });
  it("permits HTTPS official links but not executable or local URLs", () => {
    expect(safeOfficialUrl("https://www.firstinspires.org/programs/frc/")).toBe("https://www.firstinspires.org/programs/frc/");
    expect(safeOfficialUrl("javascript:alert(1)")).toBeNull();
    expect(safeOfficialUrl("https://127.0.0.1/private")).toBeNull();
  });
  it("requires matching password confirmation", () => {
    expect(validateNewPassword("new-password-123", "different-password")).toBe("Your passwords do not match.");
    expect(validateNewPassword("new-password-123", "new-password-123")).toBeNull();
  });
});