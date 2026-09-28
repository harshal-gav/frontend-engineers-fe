require('dotenv').config();
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmails() {
  const htmlFilePath = '/Users/harshalgavali/.gemini/antigravity-ide/brain/2f3fa10c-26f9-4786-bf53-107c5d0f8f0c/pro_membership_promo_email.html';
  const txtFilePath = '/Users/harshalgavali/Desktop/job-portal/free_users_emails.txt';

  if (!fs.existsSync(htmlFilePath) || !fs.existsSync(txtFilePath)) {
    console.error("Could not find HTML or TXT files.");
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
  const txtContent = fs.readFileSync(txtFilePath, 'utf-8');

  // Parse the batches from the text file
  const lines = txtContent.split('\n');
  const allEmails = [];
  
  for (const line of lines) {
    if (line.trim().length > 0 && !line.startsWith('---')) {
      const emails = line.split(',').map(e => e.trim()).filter(e => e.includes('@'));
      allEmails.push(...emails);
    }
  }

  // The last 25 already succeeded in the previous run, so we only need the first 600
  const unsentEmails = allEmails.slice(0, 600);

  const batches = [];
  for (let i = 0; i < unsentEmails.length; i += 49) {
    batches.push(unsentEmails.slice(i, i + 49));
  }

  console.log(`Found ${batches.length} batches to send.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const bccList = batches[i];
    console.log(`Sending Batch ${i + 1}/${batches.length} to ${bccList.length} users...`);

    try {
      const data = await resend.emails.send({
        from: 'FrontendEngineers <hello@frontendengineers.com>',
        to: ['hello@frontendengineers.com'], // Send to ourselves, BCC the rest
        bcc: bccList,
        subject: 'Stop wasting time hunting for frontend jobs 🛑',
        html: htmlContent,
      });

      if (data.error) {
        console.error(`Error sending batch ${i + 1}:`, data.error);
        failCount++;
      } else {
        console.log(`Successfully sent batch ${i + 1}. ID: ${data.data.id}`);
        successCount++;
      }
    } catch (error) {
      console.error(`Exception sending batch ${i + 1}:`, error);
      failCount++;
    }

    // Small delay to avoid hitting Resend rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nDONE! Sent ${successCount} batches successfully. ${failCount} batches failed.`);
  process.exit(0);
}

sendEmails().catch(console.error);
