const admin = require('firebase-admin');
const { Resend } = require('resend');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();
const resend = new Resend(process.env.RESEND_API_KEY);

const BCC_EMAIL = 'harshal.gav@gmail.com';

function buildMarketingEmailHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unlock 100+ Job Sources - FrontendEngineers.com</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 40px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 10px; font-weight: 800; letter-spacing: -0.5px;">FrontendEngineers.com</h1>
              <p style="color: #93c5fd; font-size: 16px; margin: 0; font-weight: 500;">Skip the noise. Get hired faster.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="font-size: 22px; color: #0f172a; margin: 0 0 20px; font-weight: 700; line-height: 1.4;">
                Tired of checking 100 different job boards every day?
              </h2>

              <p style="font-size: 16px; color: #475569; margin: 0 0 20px; line-height: 1.6;">
                We get it. Finding a high-quality remote frontend role is exhausting. You're constantly jumping between LinkedIn, Indeed, and dozens of company career pages just hoping to catch a job before 500 other people apply.
              </p>

              <p style="font-size: 16px; font-weight: 600; color: #2563eb; margin: 0 0 24px; line-height: 1.6;">
                That's why we built the ultimate Pro Membership.
              </p>

              <!-- Feature Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px;">
                    <p style="font-size: 16px; color: #166534; margin: 0 0 16px; font-weight: 700;">
                      When you upgrade to Pro, you get instant access to:
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #15803d; line-height: 1.5;">
                          ✨ <strong>Jobs aggregated from 100+ sources</strong> and direct company career pages. You don't need to visit each and every site — just use this one!
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #15803d; line-height: 1.5;">
                          ⚡ <strong>1-Click Direct Apply Links</strong> taking you straight to the ATS, bypassing job board fluff.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 15px; color: #15803d; line-height: 1.5;">
                          🤖 <strong>AI-Powered Filters</strong> for React, Vue, Angular, and TypeScript roles.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="font-size: 16px; color: #475569; margin: 0 0 32px; line-height: 1.6; text-align: center;">
                Stop wasting hours searching and start applying to the best remote jobs instantly.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://www.frontendengineers.com/pricing" target="_blank" style="display: inline-block; background-color: #d97706; color: #ffffff; font-size: 18px; font-weight: 700; text-decoration: none; padding: 18px 40px; border-radius: 50px; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.4); letter-spacing: 0.5px;">
                      ⭐ Unlock All Jobs - Just $9/mo
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 13px; color: #64748b; margin: 0 0 8px; line-height: 1.5;">
                You are receiving this because you registered at FrontendEngineers.com
              </p>
              <p style="font-size: 13px; color: #64748b; margin: 0;">
                <a href="https://www.frontendengineers.com" style="color: #2563eb; text-decoration: none;">FrontendEngineers.com</a> • Your Remote Job Search, Simplified.
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
  try {
    console.log('🔄 Fetching latest free users from Firebase...');
    const snapshot = await db.collection('users').get();
    
    let freeEmails = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      // Only get users who are NOT premium
      if (data.isPremium !== true) {
        let email = data.email;
        // If email isn't in Firestore doc, grab it from Firebase Auth
        if (!email) {
          try {
            const userRec = await admin.auth().getUser(doc.id);
            email = userRec.email;
          } catch (e) {
            // Ignore users with no email
          }
        }
        if (email) {
          freeEmails.push(email);
        }
      }
    }

    // Deduplicate
    freeEmails = [...new Set(freeEmails)];
    console.log(`✅ Found ${freeEmails.length} unique FREE users in database.\n`);

    if (freeEmails.length === 0) {
      console.log('No free users found. Exiting.');
      return;
    }

    // Resend allows up to 50 recipients per email. 
    // We will chunk to 48 so with 'to' and 'bcc' (harshal) it equals 50 exactly.
    const CHUNK_SIZE = 48; 
    const chunks = [];
    for (let i = 0; i < freeEmails.length; i += CHUNK_SIZE) {
      chunks.push(freeEmails.slice(i, i + CHUNK_SIZE));
    }

    console.log(`Sending in ${chunks.length} batches to comply with Resend's 50-recipient limit...\n`);

    const html = buildMarketingEmailHtml();

    // Send emails
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const bccList = [...chunk, BCC_EMAIL];

      try {
        const { data, error } = await resend.emails.send({
          from: 'FrontendEngineers.com <no-reply@frontendengineers.com>',
          to: ['no-reply@frontendengineers.com'], // Primary TO address
          bcc: bccList,                           // Put all free users + harshal in BCC
          subject: 'Stop checking 100 job boards. Do this instead.',
          html: html,
        });

        if (error) {
          console.error(`❌ Batch ${i + 1} failed:`, error);
        } else {
          console.log(`✅ Batch ${i + 1} sent to ${chunk.length} users (Resend ID: ${data.id})`);
        }
      } catch (err) {
        console.error(`❌ Batch ${i + 1} fatal error:`, err.message);
      }
      
      // Delay to prevent rate limits
      await new Promise(r => setTimeout(r, 800));
    }

    console.log('\n🎉 All marketing emails sent successfully to free users!');

  } catch (err) {
    console.error('Fatal error:', err);
  }
}

main();
