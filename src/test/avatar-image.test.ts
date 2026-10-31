import { describe, expect, it } from "vitest";
import { AVATAR_MAX_BYTES, avatarCrop, validateAvatar } from "@/lib/avatar-image";

describe("Profile photo rules", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s at exactly 8 MB", (type) => {
    expect(AVATAR_MAX_BYTES).toBe(8 * 1024 * 1024);
    expect(validateAvatar({ type, size: 8 * 1024 * 1024 })).toBeNull();
  });
  it("rejects an image one byte above 8 MB", () => {
    expect(validateAvatar({ type: "image/jpeg", size: 8 * 1024 * 1024 + 1 })).not.toBeNull();
  });
  it("rejects unsupported image formats", () => {
    expect(validateAvatar({ type: "image/gif", size: 100 })).not.toBeNull();
  });
  it.each([
    [2400, 1600, 400, 0, 1600],
    [1600, 2400, 0, 400, 1600],
    [1200, 1200, 0, 0, 1200],
  ])("center crops %s × %s into 400 × 400", (width, height, x, y, side) => {
    expect(avatarCrop(width, height)).toEqual({ x, y, side, edge: 400 });
  });
  it("does not upscale small photos", () => {
    expect(avatarCrop(200, 300)).toEqual({ x: 0, y: 50, side: 200, edge: 200 });
  });
});