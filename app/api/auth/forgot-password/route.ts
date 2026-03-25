import { NextResponse } from 'next/server';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const OTP_SECRET = process.env.OTP_SECRET || 'fallback-secret-key-123';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Fetch User by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Return 200 anyway to prevent user enumeration
      return NextResponse.json({ success: true, message: 'If the email exists, an OTP was sent.' });
    }

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

    // 3. Hash OTP with 60 second expiry
    const expiresAt = Date.now() + 60 * 1000;
    const hashData = `${otp}.${email}.${expiresAt}.${OTP_SECRET}`;
    const hash = crypto.createHash('sha256').update(hashData).digest('hex');

    // 4. Send Email via Nodemailer
    const mailOptions = {
      from: `"Dot Ads System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Password Reset OTP`,
      text: `Hello ${user.name},\n\nYour OTP for password reset is: ${otp}\n\nIf you did not request this, please ignore this email.`,
      html: `<p>Hello ${user.name},</p><p>Your OTP for password reset is: <strong>${otp}</strong></p><p>If you did not request this, please ignore this email.</p>`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, hash, expiresAt });
  } catch (error: any) {
    console.error('Error in forgot-password:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
