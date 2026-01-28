import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, businessName, role, location } = body;

    // Simulate API processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate mock IDs
    const userId = `user_${Math.random().toString(36).substring(2, 11)}`;
    const orgId = `org_${Math.random().toString(36).substring(2, 11)}`;

    return NextResponse.json({
      userId,
      orgId,
      businessName,
      message: `Welcome to Lighthouse, ${fullName}! Your business "${businessName}" has been set up.`,
    });
  } catch {
    return NextResponse.json(
      { message: 'Sign up failed. Please try again.' },
      { status: 500 }
    );
  }
}
