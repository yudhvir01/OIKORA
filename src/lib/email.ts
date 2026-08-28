import nodemailer from "nodemailer";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null =
  null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) return null;

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? Number(SMTP_PORT) : 587,
    secure: SMTP_PORT === "465",
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return cachedTransporter;
}

// Sends an email via SMTP when SMTP_HOST is configured; otherwise logs the
// message so alert flows still work end-to-end in environments (like local
// dev or this sandbox) without real email credentials.
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(
      `[email:not-configured] to=${input.to} subject=${JSON.stringify(input.subject)}\n${input.text}`,
    );
    return false;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "inventory-alerts@localhost",
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
  return true;
}
