import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  try {
    const { title, description, datetime, meetingLink } = await req.json();

    const prompt = `You are an AI assistant for Dot Ads. 
Write a professional meeting invitation email.
Meeting Title: ${title}
Description: ${description || 'No description provided.'}
Date and Time: ${datetime}
Meeting Link: ${meetingLink || 'To be shared later'}

Your response must be in JSON format with exactly two fields:
"subject": A catchy and professional subject line.
"body": A polite and concise email body.

Do not include any other text in your response, only the JSON.`;

    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('AI failed to generate content');

    const result = JSON.parse(content);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in AI compose:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
