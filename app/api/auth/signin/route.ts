import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // Simulate API processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate mock response
    const userId = `user_${Math.random().toString(36).substring(2, 11)}`;
    const orgId = `org_${Math.random().toString(36).substring(2, 11)}`;

    return NextResponse.json({
      userId,
      orgId,
      businessName: 'Demo Business',
      role: 'Owner',
    });
  } catch {
    return NextResponse.json(
      { message: 'Sign in failed. Please check your credentials.' },
      { status: 401 }
    );
  }
}
