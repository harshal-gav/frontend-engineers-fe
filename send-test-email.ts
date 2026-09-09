import { Resend } from "resend";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmail() {
  try {
    console.log("Reading email draft...");
    const htmlContent = fs.readFileSync(path.join(process.cwd(), "early-access-email-draft.html"), "utf-8");

    console.log("Sending test email to harshal.gav@gmail.com...");
    
    const { data, error } = await resend.emails.send({
      from: "FrontendEngineers <hello@frontendengineers.com>",
      to: "harshal.gav@gmail.com",
      subject: "⭐ Priority Access: Fresh remote frontend jobs are here!",
      html: htmlContent,
    });

    if (error) {
      console.error("Error sending test email:", error);
    } else {
      console.log("Successfully sent test email!", data);
    }
  } catch (error) {
    console.error("Critical error during test send:", error);
  }
}

sendTestEmail();
