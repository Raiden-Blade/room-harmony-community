import { describe, expect, it } from "vitest";

import { coordinatePresentation, dateStamp } from "../utils/labels";

describe("dateStamp", () => {
  it("keeps official snapshot dates in Japan time", () => {
    expect(dateStamp("2026-08-19T00:00:00+09:00")).toBe("2026/08/19時点");
  });
});

describe("coordinatePresentation", () => {
  it("keeps official inspiration, plans, and user-declared real rooms distinct", () => {
    expect(coordinatePresentation({ kind: "PLAN", creator_id: null, image_rights: "EXPLICITLY_PERMITTED" }).primary).toBe("参考コーデ");
    expect(coordinatePresentation({ kind: "PLAN", creator_id: "creator-1", image_rights: "USER_UPLOADED_LOCAL" }).primary).toBe("PLAN（投稿者の構想）");
    expect(coordinatePresentation({ kind: "REAL", creator_id: "creator-1", image_rights: "USER_UPLOADED_LOCAL" }).primary).toBe("REAL ROOM（ユーザー申告）");
  });
});
