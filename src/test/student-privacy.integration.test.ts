import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

const url = process.env['SUPABASE_URL'];
const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
const token = process.env['TEST_STUDENT_TOKEN'];
const otherId = process.env['TEST_OTHER_STUDENT_ID'];

describe.skipIf(!url || !key || !token || !otherId)("Test-account student privacy", () => {
  function client() {
    if (!url || !key || !token || !otherId) throw new Error("Test-account configuration required");
    return createClient(url, key, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  }
  it("does not expose another student's raw profile", async () => {
    const { data, error } = await client().from("profiles").select("*").eq("id", otherId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
  it("returns only shared fields on the connected student's card", async () => {
    const { data, error } = await client().rpc("student_profile_cards", { p_ids: [otherId] });
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].country_region).toBeNull();
    expect(data[0].first_name).toBeNull();
    expect(data[0].preferences).toBeNull();
    expect(data[0].avatar_path).toBeNull();
  });
});