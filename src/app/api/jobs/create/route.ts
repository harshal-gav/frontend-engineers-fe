import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';

import { autoTagJob } from '@/lib/job-tagger';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const auth = getAdminAuth();
    const db = getAdminDb();
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Verify user is an active employer
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists || !userDoc.data()?.isEmployer) {
      return NextResponse.json({ error: 'Forbidden: Requires an active Employer subscription.' }, { status: 403 });
    }

    const body = await req.json();
    
    // Validate required fields
    if (!body.title || !body.applyUrl || !body.company?.name || !body.description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Auto-generate tags using rule-based extraction
    const tags = autoTagJob({
      title: body.title,
      description: body.description,
      location: body.location,
      country: body.country
    });

    // Build the job object
    const newJob = {
      id: crypto.randomUUID(), // we can let Firestore generate an ID or use crypto
      title: body.title,
      description: body.description,
      location: body.location || null,
      country: body.country || null,
      remoteType: body.remoteType || "REMOTE",
      postedAt: new Date().toISOString(),
      sourceHash: `employer-${uid}-${Date.now()}`,
      applyUrl: body.applyUrl,
      company: {
        id: crypto.randomUUID(),
        name: body.company.name,
        logoUrl: body.company.logoUrl || null,
        industry: body.company.industry || null,
        website: body.company.website || null,
      },
      employerId: uid, // Track who posted it
      isFeatured: true, // "markets here like the job that posted they will get appered at the top"
      aiTags: tags
    };

    // Use Firestore auto-id if we don't want to enforce our own, but using crypto is fine
    await db.collection('jobs').doc(newJob.id).set(newJob);

    return NextResponse.json({ success: true, job: newJob }, { status: 201 });

  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
