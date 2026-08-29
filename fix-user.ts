import * as admin from 'firebase-admin';

// Initialize Firebase Admin (use credentials from env if available)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

async function fixUser() {
  const db = admin.firestore();
  const snapshot = await db.collection('users').where('email', '==', 'omesanni12345@yahoo.com').get();
  
  if (snapshot.empty) {
    console.log("User not found.");
    return;
  }
  
  const doc = snapshot.docs[0];
  // Since they paid, they should have roughly 1 month from creation. Let's give them 30 days from creation.
  const createdAt = new Date(doc.data().createdAt);
  const expiresAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const stillActive = expiresAt > new Date();
  
  await doc.ref.update({
    isPremium: stillActive,
    subscriptionExpiresAt: expiresAt.toISOString(),
  });
  
  console.log(`Updated user ${doc.id} to isPremium: ${stillActive}, expiresAt: ${expiresAt.toISOString()}`);
}

fixUser().catch(console.error);
