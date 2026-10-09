import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
  }

  try {
    const docRef = doc(db, 'reports', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || !docSnap.data().pdfBase64) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const pdfBuffer = Buffer.from(docSnap.data().pdfBase64, 'base64');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="report_${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Failed to retrieve report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
