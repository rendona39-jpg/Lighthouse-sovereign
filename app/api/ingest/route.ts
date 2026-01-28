import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Simulate file processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate mock results based on file type
    const fileName = file.name.toLowerCase();
    let certified = 0;
    let quarantined = 0;

    if (fileName.endsWith('.csv')) {
      certified = Math.floor(Math.random() * 400) + 200;
      quarantined = Math.floor(Math.random() * 20);
    } else if (fileName.endsWith('.pdf')) {
      certified = Math.floor(Math.random() * 100) + 50;
      quarantined = Math.floor(Math.random() * 10);
    } else {
      certified = Math.floor(Math.random() * 50) + 10;
      quarantined = Math.floor(Math.random() * 5);
    }

    return NextResponse.json({
      success: true,
      certified,
      quarantined,
      message: `${certified} facts certified from "${file.name}". ${quarantined > 0 ? `${quarantined} items quarantined for review.` : 'All data verified.'}`,
    });
  } catch {
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    );
  }
}
