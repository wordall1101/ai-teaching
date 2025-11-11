import "server-only";

import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";

export async function requireAdminSession() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    throw new ChatSDKError("forbidden:auth");
  }

  return session;
}
