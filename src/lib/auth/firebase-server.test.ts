import { describe, expect, it } from "vitest";
import { assertFirebaseTokenClaims } from "@/lib/auth/firebase-server";

describe("firebase token claim validation", () => {
  it("accepts a valid payload shape", () => {
    expect(() =>
      assertFirebaseTokenClaims(
        {
          sub: "firebase-uid",
          aud: "demo-project",
          iss: "https://securetoken.google.com/demo-project",
          email: "demo@example.com",
        },
        "demo-project",
      ),
    ).not.toThrow();
  });

  it("rejects payloads with a mismatched issuer", () => {
    expect(() =>
      assertFirebaseTokenClaims(
        {
          sub: "firebase-uid",
          aud: "demo-project",
          iss: "https://securetoken.google.com/other-project",
          email: "demo@example.com",
        },
        "demo-project",
      ),
    ).toThrow("issuer");
  });
});
