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
    const snapshot = await db.collection('users').where('isPremium', '==', true).get();
    const now = new Date();
    
    let expiredCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.subscriptionExpiresAt) {
        const expiresAt = new Date(data.subscriptionExpiresAt);
        
        if (expiresAt < now) {
          console.log(`User ${doc.id} expired on ${expiresAt.toISOString()}. Revoking premium status.`);
          await db.collection('users').doc(doc.id).set({
            isPremium: false,
            isSubscribed: false
          }, { merge: true });
          expiredCount++;
        }
      }
    }
    
    console.log(`\nSuccessfully revoked premium access for ${expiredCount} expired users.`);
  } catch (err) {
    console.error(err);
  }
}
main();
