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
    console.log(`Found ${snapshot.size} pro users.`);
    
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
      console.log(`ID: ${doc.id} | Email: ${email}`);
    }
  } catch (err) {
    console.error(err);
  }
}
main();
