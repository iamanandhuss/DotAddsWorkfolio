import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const OTP_SECRET = process.env.OTP_SECRET || 'fallback-secret-key-123';

export async function POST(req: Request) {
  try {
    const { email, otp, hash, newPassword } = await req.json();

    if (!email || !otp || !hash || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify Hash
    const expectedHashData = `${otp}.${email}.${OTP_SECRET}`;
    const expectedHash = crypto.createHash('sha256').update(expectedHashData).digest('hex');

    if (hash !== expectedHash) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // 2. Encrypt New Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Update User Password in DB
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', email);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Error in reset-password:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
