import { Resend } from "resend";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY in .env");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

async function sendTestEmail() {
  try {
    const htmlContent = fs.readFileSync("email/promo.html", "utf-8");

    const response = await resend.emails.send({
      from: "Harshal <hello@frontendengineers.com>",
      to: "harshal.gav@gmail.com",
      subject: "Quick question about your job search",
      html: htmlContent,
    });

    if (response.error) {
      console.error("Failed to send test email:", response.error);
    } else {
      console.log("Test email sent successfully to harshal.gav@gmail.com!");
      console.log("Response ID:", response.data?.id);
    }
  } catch (e) {
    console.error("Error sending test email:", e);
  }
}

sendTestEmail();
