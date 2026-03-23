import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Groq offers an OpenAI-compatible endpoint!
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

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
    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
    }

    // 1. Fetch Task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 2. Fetch User
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', task.assigned_to)
      .single();

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: 'User or email not found' }, { status: 404 });
    }

    // 3. Draft AI Message
    const prompt = `You are an AI assistant for the Dot Ads Employee Management System.
A new task has just been assigned to an employee named ${user.name.split(' ')[0]}.
Task Title: ${task.title}
Task Description: ${task.description || 'No description provided.'}
Priority: ${task.priority}
Deadline: ${task.deadline}

Write a short, friendly, and professional email notification message (max 3-4 sentences) informing them about this new task. Include emojis naturally. Sign off as "Dot Ads Notifications".`;

    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
    });

    const aiMessage = completion.choices[0].message.content || 'You have a new task assigned!';

    // 4. Send Email via Nodemailer
    const mailOptions = {
      from: `"Dot Ads System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `New Task Assigned: ${task.title}`,
      text: aiMessage,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`[Email] Message sent to ${user.email}: ${info.messageId}`);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Error in notify/task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
