require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');

if (!admin.apps.length) {
  if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      })
    });
  } else {
    admin.initializeApp();
  }
}

async function extractFreeUsers() {
  const db = admin.firestore();
  const auth = admin.auth();
  
  console.log('Fetching users from Firestore...');
  const snapshot = await db.collection('users').get();
  
  const freeUids = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    let isPremium = false;
    
    if (data.isPremium === true) {
      if (data.subscriptionExpiresAt) {
        if (new Date(data.subscriptionExpiresAt) > new Date()) {
          isPremium = true;
        }
      } else {
        isPremium = true;
      }
    }
    
    // Check if employer too, maybe we don't want to email active employers
    const isEmployer = data.isEmployer === true;
    
    if (!isPremium && !isEmployer) {
      freeUids.push(doc.id);
    }
  });
  
  console.log(`Found ${freeUids.length} free users. Fetching emails from Auth...`);
  
  const emails = [];
  
  // We can fetch Auth users in batches of 100
  for (let i = 0; i < freeUids.length; i += 100) {
    const batch = freeUids.slice(i, i + 100).map(uid => ({ uid }));
    const result = await auth.getUsers(batch);
    result.users.forEach(u => {
      if (u.email) {
        emails.push(u.email);
      }
    });
  }
  
  console.log(`Successfully extracted ${emails.length} emails.`);
  
  // Chunk into 50
  let outputText = '';
  for (let i = 0; i < emails.length; i += 50) {
    const chunk = emails.slice(i, i + 50);
    outputText += `--- BATCH ${Math.floor(i / 50) + 1} (${chunk.length} users) ---\n`;
    outputText += chunk.join(', ') + '\n\n';
  }
  
  fs.writeFileSync('free_users_emails.txt', outputText);
  console.log('Done! Wrote to free_users_emails.txt');
  process.exit(0);
}

extractFreeUsers().catch(console.error);
