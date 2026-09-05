import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getReorderSuggestions } from "@/lib/reorder-suggestions";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suggestions = await getReorderSuggestions(session.user.activeOrganizationId);
  return NextResponse.json({ suggestions });
}
