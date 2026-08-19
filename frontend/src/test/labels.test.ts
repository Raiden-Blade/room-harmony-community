import { describe, expect, it } from "vitest";

import { dateStamp } from "../utils/labels";

describe("dateStamp", () => {
  it("keeps official snapshot dates in Japan time", () => {
    expect(dateStamp("2026-08-19T00:00:00+09:00")).toBe("2026/08/19時点");
  });
});
