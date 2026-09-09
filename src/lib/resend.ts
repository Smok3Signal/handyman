import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || "HandyMan <onboarding@resend.dev>";

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const link = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Verify your HandyMan account",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>Welcome to HandyMan, ${name}!</h2>
          <p>Please confirm your email address to activate your account.</p>
          <p>
            <a href="${link}" style="background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
              Verify Email
            </a>
          </p>
          <p>Or paste this link in your browser:<br/>${link}</p>
          <p>This link expires in 24 hours.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Resend verification email error:", error);
  }
}

export async function sendAccountActionEmail(
  email: string,
  name: string,
  subject: string,
  bodyHtml: string
) {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>Hi ${name},</h2>
          ${bodyHtml}
        </div>
      `,
    });
  } catch (error) {
    console.error("Resend account action email error:", error);
  }
}