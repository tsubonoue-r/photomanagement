/**
 * Lark Message API
 * POST /api/lark/message - Larkメッセージを送信
 */
import { NextRequest, NextResponse } from 'next/server';
import { sendLarkMessage, isLarkConfigured } from '@/lib/lark/client';

interface SendMessageRequest {
  email: string;
  content: string;
}

export async function POST(request: NextRequest) {
  // Lark設定チェック
  if (!isLarkConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Lark is not configured' },
      { status: 500 }
    );
  }

  try {
    const body: SendMessageRequest = await request.json();
    const { email, content } = body;

    if (!email || !content) {
      return NextResponse.json(
        { success: false, error: 'email and content are required' },
        { status: 400 }
      );
    }

    const result = await sendLarkMessage(email, content);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Lark Message API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
