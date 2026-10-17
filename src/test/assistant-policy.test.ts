import { describe, expect, it } from "vitest";
import { permittedProfile, isSummaryRequest } from "@/lib/assistant-policy";
describe("assistant privacy rules", () => {
  it("shares permitted preferences but never passwords, tokens, email or private group data", () => {
    expect(permittedProfile({ intended_major: "Robotics", grade: "11", interests: ["engineering"], password: "secret", access_token: "secret", email: "private@example.test", groups: ["private"], bio: "sensitive" })).toEqual({ intended_major: "Robotics", grade: "11", interests: ["engineering"] });
  });
  it("recognizes the student's explicit summary request without treating other messages as summary requests", () => {
    expect(isSummaryRequest("Summarize Our Conversation")).toBe(true);
    expect(isSummaryRequest("Find competitions for me")).toBe(false);
  });
});