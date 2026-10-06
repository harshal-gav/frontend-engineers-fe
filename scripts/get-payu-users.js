const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

async function main() {
  try {
    // Find all users who paid via PayU
    const snapshot = await db.collection('users').where('paymentGateway', '==', 'payu').get();
    const now = new Date();

    console.log(`Found ${snapshot.size} PayU users total.\n`);

    const expired = [];
    const active = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      let email = data.email;
      if (!email) {
        try {
          const user = await admin.auth().getUser(doc.id);
          email = user.email;
        } catch(e) {
          email = '<no-email>';
        }
      }

      const expiresAt = data.subscriptionExpiresAt;
      const isExpired = expiresAt && new Date(expiresAt) < now;

      const entry = { uid: doc.id, email, expiresAt: expiresAt || 'No date', isPremium: data.isPremium };

      if (isExpired || !data.isPremium) {
        expired.push(entry);
      } else {
        active.push(entry);
      }
    }

    console.log(`--- EXPIRED PayU Users (${expired.length}) ---`);
    for (const u of expired) {
      console.log(`UID: ${u.uid} | Email: ${u.email} | Expired: ${u.expiresAt} | isPremium: ${u.isPremium}`);
    }

    console.log(`\n--- ACTIVE PayU Users (${active.length}) ---`);
    for (const u of active) {
      console.log(`UID: ${u.uid} | Email: ${u.email} | Expires: ${u.expiresAt} | isPremium: ${u.isPremium}`);
    }
  } catch (err) {
    console.error(err);
  }
}
main();
