import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { type, userId, targetUserId, data } = await req.json();

    // type: 'status_change' | 'leave_request' | 'leave_response'
    // userId: ID of the user triggering the notification
    // targetUserId: ID of the user receiving the notification (optional, defaults to admin for status/leave)

    let recipientId = targetUserId;

    if (!recipientId) {
      // 1. Fetch Admin User if no recipient specified
      const { data: admin } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();
      if (admin) recipientId = admin.id;
    }

    if (!recipientId) return NextResponse.json({ error: 'No recipient found' }, { status: 404 });

    // 2. Fetch triggering user
    const { data: user } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single();

    const userName = user?.name || 'An employee';

    let prompt = '';
    let title = '';

    if (type === 'status_change') {
      title = 'Task Status Update';
      prompt = `Draft a short in-app notification message (1 sentence) for an Admin. 
Employee ${userName} just updated task "${data.taskTitle}" to "${data.newStatus}".
Be professional and concise.`;
    } else if (type === 'leave_request') {
      title = 'New Leave Request';
      prompt = `Draft a short in-app notification message (1 sentence) for an Admin. 
Employee ${userName} just submitted a ${data.leaveType} leave request from ${data.fromDate} to ${data.toDate}.
Be professional and concise.`;
    } else if (type === 'leave_response') {
      title = `Leave Request ${data.status}`;
      prompt = `Draft a short in-app notification message (1 sentence) for an Employee. 
Admin just ${data.status} your leave request from ${data.fromDate} to ${data.toDate}.
Be professional and encouraging.`;
    }

    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    });

    const aiMessage = completion.choices[0].message.content || 'Important update requires your attention.';

    // 3. Insert In-App Notification
    await supabase.from('notifications').insert([{
      user_id: recipientId,
      title: title,
      message: aiMessage,
      type: type,
      is_read: false
    }]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in notify/general:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
