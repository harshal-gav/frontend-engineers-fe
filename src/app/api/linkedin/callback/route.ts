import { NextResponse } from 'next/server';

/**
 * LinkedIn OAuth — Step 2: Handle the callback and exchange code for token
 * LinkedIn redirects here after user authorizes
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (error) {
    return new Response(
      `<html><body style="font-family:system-ui;max-width:600px;margin:40px auto;padding:20px;background:#0a0a0a;color:white;">
        <h1 style="color:#f43f5e;">❌ Authorization Failed</h1>
        <p>${error}: ${errorDescription}</p>
        <a href="/" style="color:#00ffcc;">← Back to home</a>
      </body></html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!code) {
    return new Response(
      `<html><body style="font-family:system-ui;max-width:600px;margin:40px auto;padding:20px;background:#0a0a0a;color:white;">
        <h1 style="color:#f43f5e;">❌ No authorization code received</h1>
        <a href="/" style="color:#00ffcc;">← Back to home</a>
      </body></html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'LinkedIn credentials not configured' }, { status: 500 });
  }

  const baseUrl = 'https://www.frontendengineers.com';
  
  const redirectUri = `${baseUrl}/api/linkedin/callback`;

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Token exchange failed: ${tokenRes.status} ${errText}`);
    }

    const tokenData = await tokenRes.json();

    // Fetch the user's LinkedIn member ID
    let memberId = 'unknown';
    let memberName = '';
    try {
      const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        memberId = meData.sub;
        memberName = meData.name || '';
      }
    } catch (e) {
      // Non-fatal
    }

    const expiryDays = Math.round(tokenData.expires_in / 86400);

    // Display the credentials (only show to admin — this page is not linked anywhere)
    return new Response(
      `<html>
      <body style="font-family:system-ui;max-width:700px;margin:40px auto;padding:20px;background:#0a0a0a;color:white;">
        <h1 style="color:#00ffcc;">✅ LinkedIn Authorization Successful!</h1>
        ${memberName ? `<p>Welcome, <strong>${memberName}</strong>!</p>` : ''}
        <p>Token expires in <strong>${expiryDays} days</strong>.</p>
        
        <h2 style="color:#00ffcc;margin-top:30px;">📋 Add these as GitHub Secrets</h2>
        <p style="color:#999;">Go to your GitHub repo → Settings → Secrets → Actions</p>
        
        <div style="background:#111;border:1px solid #333;border-radius:8px;padding:16px;margin:12px 0;">
          <p style="color:#999;margin:0 0 4px 0;font-size:12px;">LINKEDIN_ACCESS_TOKEN</p>
          <textarea readonly style="width:100%;height:80px;background:#0a0a0a;border:1px solid #333;color:#00ffcc;padding:8px;font-family:monospace;font-size:11px;border-radius:4px;resize:none;" onclick="this.select()">${tokenData.access_token}</textarea>
        </div>
        
        <div style="background:#111;border:1px solid #333;border-radius:8px;padding:16px;margin:12px 0;">
          <p style="color:#999;margin:0 0 4px 0;font-size:12px;">LINKEDIN_PERSON_ID</p>
          <input readonly value="${memberId}" style="width:100%;background:#0a0a0a;border:1px solid #333;color:#00ffcc;padding:8px;font-family:monospace;font-size:14px;border-radius:4px;" onclick="this.select()" />
        </div>
        
        <div style="background:#111;border:1px solid #333;border-radius:8px;padding:16px;margin:12px 0;">
          <p style="color:#999;margin:0 0 4px 0;font-size:12px;">GEMINI_API_KEY</p>
          <p style="color:#999;font-size:13px;">Use your existing Gemini API key from your .env file</p>
        </div>

        <p style="color:#666;font-size:12px;margin-top:20px;">⚠️ Do not share this page. Close it after copying the values.</p>
        <a href="/" style="color:#00ffcc;text-decoration:none;">← Back to home</a>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );

  } catch (err: any) {
    return new Response(
      `<html><body style="font-family:system-ui;max-width:600px;margin:40px auto;padding:20px;background:#0a0a0a;color:white;">
        <h1 style="color:#f43f5e;">❌ Token Exchange Failed</h1>
        <pre style="background:#111;padding:12px;border-radius:8px;overflow:auto;color:#f43f5e;">${err.message}</pre>
        <a href="/" style="color:#00ffcc;">← Back to home</a>
      </body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
