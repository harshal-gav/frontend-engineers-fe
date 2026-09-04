import { NextResponse } from 'next/server';

/**
 * LinkedIn OAuth — Step 1: Redirect user to LinkedIn authorization
 * Visit: https://www.frontendengineers.com/api/linkedin/auth
 */
export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json({ error: 'LINKEDIN_CLIENT_ID not configured' }, { status: 500 });
  }

  const baseUrl = 'https://www.frontendengineers.com';
  
  const redirectUri = `${baseUrl}/api/linkedin/callback`;
  const state = Math.random().toString(36).substring(2, 15);

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'openid profile w_member_social w_organization_social');
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
