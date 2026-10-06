const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const EXPIRED_USERS = [
  { email: 'ranavj90@gmail.com', expiredOn: '2026-09-30' },
  { email: 'arshsharma85@gmail.com', expiredOn: '2026-10-04' },
  { email: 'vijaythumar1020@gmail.com', expiredOn: '2026-09-30' },
];

const BCC_EMAIL = 'harshal.gav@gmail.com';

function buildEmailHtml(userEmail, expiredOn) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Miss You - FrontendEngineers.com</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 26px; margin: 0 0 8px; font-weight: 700; letter-spacing: -0.5px;">FrontendEngineers.com</h1>
              <p style="color: #93c5fd; font-size: 14px; margin: 0; font-weight: 500;">Your Exclusive Remote Frontend Job Portal</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">

              <!-- Greeting -->
              <p style="font-size: 16px; color: #1e293b; margin: 0 0 20px; line-height: 1.6;">
                Hi there! 👋
              </p>

              <p style="font-size: 16px; color: #475569; margin: 0 0 20px; line-height: 1.7;">
                We noticed your <strong style="color: #1e293b;">Pro Membership</strong> expired on <strong style="color: #dc2626;">${expiredOn}</strong>. We hope you found great value during your subscription!
              </p>

              <!-- What you're missing box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 0 12px 12px 0; padding: 24px;">
                    <p style="font-size: 15px; font-weight: 700; color: #1e3a5f; margin: 0 0 16px;">Here's what you're missing out on:</p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #334155;">🎯 Jobs aggregated from <strong>100+ sources</strong> and career pages</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #334155;">🔍 AI-powered filters — Tech Stack, Remote Scope, Seniority</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #334155;">📄 Full job descriptions, requirements, and salary info</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #334155;">🔗 1-click apply links direct to company career pages</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #334155;">📩 10+ fresh jobs delivered to your inbox every morning</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; color: #334155;">⚡ 100% remote. 100% frontend. Updated every 24 hours.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="font-size: 16px; color: #475569; margin: 0 0 28px; line-height: 1.7;">
                New remote React, Vue, Angular, and TypeScript roles are being posted <strong>every single day</strong>. Don't let your dream job slip away — re-subscribe now and stay ahead of the competition!
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://www.frontendengineers.com/pricing" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 50px; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.35); letter-spacing: 0.3px;">
                      ⭐ Re-Subscribe Now — $9/mo
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #94a3b8; margin: 24px 0 0; text-align: center; line-height: 1.5;">
                Cancel anytime. No commitments. No hidden fees.
              </p>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px; text-align: center;">
              <p style="font-size: 13px; color: #94a3b8; margin: 0 0 8px; line-height: 1.5;">
                You received this email because you previously subscribed to FrontendEngineers.com.
              </p>
              <p style="font-size: 13px; color: #94a3b8; margin: 0;">
                Questions? Reach us at <a href="mailto:frontendengineersupport@gmail.com" style="color: #2563eb; text-decoration: none;">frontendengineersupport@gmail.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function main() {
  console.log('📧 Sending re-subscription emails to expired PayU users...\n');

  for (const user of EXPIRED_USERS) {
    try {
      const html = buildEmailHtml(user.email, user.expiredOn);

      const { data, error } = await resend.emails.send({
        from: 'FrontendEngineers.com <no-reply@frontendengineers.com>',
        to: [user.email],
        bcc: [BCC_EMAIL],
        subject: '⭐ Your Pro Membership Has Expired — Re-Subscribe to Keep Getting Hired!',
        html: html,
      });

      if (error) {
        console.error(`❌ Failed to send to ${user.email}:`, error);
      } else {
        console.log(`✅ Sent to ${user.email} (ID: ${data.id})`);
      }
    } catch (err) {
      console.error(`❌ Error sending to ${user.email}:`, err.message);
    }
  }

  console.log('\n✅ Done!');
}

main();
