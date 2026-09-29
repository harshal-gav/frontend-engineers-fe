#!/usr/bin/env node
/**
 * LinkedIn OAuth2 Setup Helper
 * 
 * Run this script ONCE to get a LinkedIn access token for your Page.
 * 
 * Prerequisites:
 *   1. Create a LinkedIn App at https://www.linkedin.com/developers/
 *   2. Request "Community Management API" access on the Products tab
 *   3. Ensure https://www.frontendengineers.com/callback is in Authorized Redirect URLs
 *   4. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in your .env
 * 
 * Usage:
 *   node scripts/linkedin-auth-setup.js
 */

import 'dotenv/config';
import { URL } from 'url';
import readline from 'readline';

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
// Use the exact redirect URI registered in the app
const REDIRECT_URI = 'https://www.frontendengineers.com/api/linkedin/callback';
// Uses "Share on LinkedIn" product (w_member_social) — posts from personal profile
// openid + profile needed to fetch your member URN
const SCOPES = 'openid profile w_member_social';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌ Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in .env');
  console.error('\nAdd these to your .env file:');
  console.error('  LINKEDIN_CLIENT_ID=your_client_id');
  console.error('  LINKEDIN_CLIENT_SECRET=your_client_secret\n');
  process.exit(1);
}

const STATE = Math.random().toString(36).substring(2);

const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('scope', SCOPES);
authUrl.searchParams.set('state', STATE);

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  return res.json();
}

async function main() {
  console.log('\n🔑 LinkedIn OAuth Setup');
  console.log('════════════════════════════════════════\n');
  console.log('1. Go to this exact URL in your browser:');
  console.log('\n' + authUrl.toString() + '\n');
  console.log('2. Log in and authorize the app.');
  console.log('3. You will be redirected to a page on your website (it might say "404 Not Found", that is perfectly fine!).');
  console.log('4. Look at the URL bar in your browser. It should look like: https://www.frontendengineers.com/callback?code=AQX...&state=...');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\n5. Paste that ENTIRE redirect URL here: ', async (pastedUrl) => {
    rl.close();
    
    try {
      const url = new URL(pastedUrl.trim());
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        console.error(`\n❌ Authorization failed: ${error} - ${url.searchParams.get('error_description')}`);
        process.exit(1);
      }

      if (!code) {
        console.error('\n❌ Could not find "code" in that URL. Please try again.');
        process.exit(1);
      }

      console.log('\n🔄 Exchanging code for Access Token...');
      const tokenData = await exchangeCodeForToken(code);

      // Fetch the user's LinkedIn member ID (person URN)
      let memberId = 'unknown';
      try {
        const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          memberId = meData.sub; // This is the person ID
        }
      } catch (e) {
        console.warn('Could not fetch member ID:', e.message);
      }

      console.log('\n' + '═'.repeat(60));
      console.log('✅ SUCCESS! Here are your LinkedIn credentials:');
      console.log('═'.repeat(60));
      console.log(`\nAccess Token:\n${tokenData.access_token}\n`);
      console.log(`Member ID (Person URN): ${memberId}`);
      console.log('═'.repeat(60));
      console.log(`Token type: ${tokenData.token_type}`);
      console.log(`Expires in: ${Math.round(tokenData.expires_in / 86400)} days`);
      
      console.log('\n📋 Next steps:');
      console.log('  1. Go to your GitHub repo → Settings → Secrets → Actions');
      console.log(`  2. Add secret: LINKEDIN_ACCESS_TOKEN_2 = <your token above>`);
      console.log(`  3. Add secret: LINKEDIN_PERSON_ID_2 = ${memberId}`);
      console.log('');
      process.exit(0);
    } catch (err) {
      console.error('\n❌ Token exchange failed:', err.message);
      process.exit(1);
    }
  });
}

main();
