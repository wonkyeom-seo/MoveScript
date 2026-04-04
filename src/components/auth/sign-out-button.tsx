"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/auth/firebase-client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      onClick={async () => {
        const auth = getFirebaseAuth();
        if (auth) {
          await signOut(auth).catch(() => undefined);
        }

        await fetch("/api/auth/session", { method: "DELETE" });
        router.replace("/auth/sign-in");
        router.refresh();
      }}
    >
      로그아웃
    </Button>
  );
}
