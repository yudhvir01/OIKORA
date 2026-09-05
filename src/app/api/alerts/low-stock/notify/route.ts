import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireAdmin } from "@/lib/authz";
import { sendEmail } from "@/lib/email";
import { getLowStockProducts } from "@/lib/low-stock";

// Triggers a low-stock summary email. Intended to be called by a scheduled
// job (e.g. a Vercel Cron hitting this route) or manually by an admin;
// there is no in-app scheduler yet.
export async function POST() {
  const session = await auth();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const recipient = process.env.ALERT_EMAIL_TO;
  if (!recipient) {
    return NextResponse.json(
      { error: "ALERT_EMAIL_TO is not configured" },
      { status: 400 },
    );
  }

  const products = await getLowStockProducts(session!.user.activeOrganizationId);
  if (products.length === 0) {
    return NextResponse.json({ sent: false, count: 0 });
  }

  const lines = products.map(
    (p) =>
      `- ${p.sku} ${p.name}: ${p.totalStock} ${p.unit} in stock (reorder point ${p.reorderPoint})`,
  );
  const text = `${products.length} product(s) are below their reorder point:\n\n${lines.join("\n")}`;

  const sent = await sendEmail({
    to: recipient,
    subject: `Low stock alert: ${products.length} product(s) need reordering`,
    text,
  });

  return NextResponse.json({ sent, count: products.length, recipient });
}
