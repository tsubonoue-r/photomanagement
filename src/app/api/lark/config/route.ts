/**
 * Lark Base設定チェックAPI
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isLarkConfigured } from '@/lib/lark/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        configured: isLarkConfigured(),
      },
    });
  } catch (error) {
    console.error('Lark config check error:', error);
    return NextResponse.json(
      { success: false, error: '設定チェックに失敗しました' },
      { status: 500 }
    );
  }
}
