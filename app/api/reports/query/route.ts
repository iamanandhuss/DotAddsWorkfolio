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
    const { query } = await req.json();

    // 1. Fetch all employees to allow AI to match names
    const { data: users } = await supabase
      .from('users')
      .select('id, name')
      .eq('role', 'employee');

    const employeeContext = users?.map(u => `${u.name} (ID: ${u.id})`).join(', ') || 'No employees found';

    // 2. Ask Groq to parse the query
    const prompt = `You are a data assistant. Parse the following report request into a structured JSON object.
Context:
- Current Date: ${new Date().toISOString().split('T')[0]}
- Employees: ${employeeContext}

Request: "${query}"

Return ONLY a JSON object with:
- type: 'attendance' | 'tasks' | 'all'
- startDate: 'YYYY-MM-DD'
- endDate: 'YYYY-MM-DD'
- employeeId: string | null (match from context if mentioned)
- explanation: a short sentence of what is being exported.

Example Query: "Tasks for John from last week"
Example Response: { "type": "tasks", "startDate": "2026-03-16", "endDate": "2026-03-22", "employeeId": "u123", "explanation": "Exporting tasks for John Smith from Mar 16 to Mar 22." }`;

    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in reports/query:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
