import { NextResponse } from 'next/server';
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

export async function POST(req: Request) {
  try {
    const { meetingId, title, description, datetime, meetingLink, participantIds, subject, body } = await req.json();

    if (!participantIds || participantIds.length === 0) {
      return NextResponse.json({ error: 'No participants' }, { status: 400 });
    }

    // Fetch details for all users
    const { data: users } = await supabase.from('users').select('*').in('id', participantIds);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    const emails = users.filter(u => u.email).map(u => u.email);
    if (emails.length === 0) {
      return NextResponse.json({ error: 'No emails found' }, { status: 404 });
    }

    // Send Emails
    const mailOptions = {
      from: `"Dot Ads System" <${process.env.EMAIL_USER}>`,
      bcc: emails.join(','),
      subject: subject || `Meeting Invite: ${title}`,
      text: body || `You are invited to a meeting: ${title} at ${datetime}. Link: ${meetingLink}`,
      html: (body || `You are invited to a meeting: ${title} at ${datetime}. Link: ${meetingLink}`).replace(/\n/g, '<br>')
    };

    await transporter.sendMail(mailOptions);

    // Create In-App Notifications
    const notifications = users.map(u => ({
      user_id: u.id,
      title: `Meeting: ${title}`,
      message: `Scheduled for ${datetime}. Check link: ${meetingLink}`,
      type: 'meeting_invite',
      is_read: false
    }));

    await supabase.from('notifications').insert(notifications);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in notify/meeting:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
