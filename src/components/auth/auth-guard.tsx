import { requireServerSession } from "@/lib/auth/server";

export async function AuthGuard({ children }: { children: React.ReactNode }) {
  await requireServerSession();
  return <>{children}</>;
}
