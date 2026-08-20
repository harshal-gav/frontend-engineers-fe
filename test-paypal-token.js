const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "BAA_05LrwY9Hq0JYQ93KS116drVdZ5d9nxoHN_qI8QPU7ka7zgQc4_2CKRWXEtz7uKBrXd2VD_Y43Qc2rk";
const secret = process.env.PAYPAL_SECRET_KEY || "EEt_sE3VAsnL5BAEGkpQwy-zhTVoL1EW_kpX4yPq-zrGNr_nSRkAlTVAxLaIFESd3qdGCd1rtAHpNpym";

const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

async function test(mode) {
  const url = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  console.log(`Testing ${mode}...`);
  const res = await fetch(`${url}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  console.log(`Status: ${res.status}`);
  const data = await res.json();
  console.log(data);
}

test('sandbox').then(() => test('live'));
