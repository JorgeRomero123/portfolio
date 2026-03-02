import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const vacancy = formData.get('vacancy') as string;
    const cvFile = formData.get('cv') as File | null;

    if (!vacancy || !cvFile) {
      return NextResponse.json(
        { error: 'Both vacancy text and CV file are required' },
        { status: 400 }
      );
    }

    if (cvFile.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'CV must be a PDF file' },
        { status: 400 }
      );
    }

    const arrayBuffer = await cvFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const content = [
      {
        type: 'document' as const,
        source: {
          type: 'base64' as const,
          media_type: 'application/pdf' as const,
          data: base64,
        },
      },
      {
        type: 'text' as const,
        text: `You are an expert CV/resume writer. You have been given a candidate's CV (attached as PDF) and a job vacancy description below.

Your task: Rewrite the CV tailored specifically to this job vacancy.

RULES:
- Output the tailored CV as clean, well-structured markdown
- THE CV MUST FIT ON A SINGLE PAGE. Be ruthlessly concise — cut filler, merge related bullets, drop less relevant experience
- Emphasize relevant experience, skills, and achievements that match the vacancy
- Reorder sections to prioritize what matters most for this role
- Adjust wording to mirror the job description's language and keywords
- NEVER fabricate or invent experience, skills, certifications, or achievements that aren't in the original CV
- You may rephrase and reframe existing experience to better align with the vacancy
- Use markdown headings (##), bullet points, and bold for structure
- Keep bullet points short (one line each). Aim for 3-4 bullets per role max
- Do not include any commentary or explanation — output ONLY the tailored CV in markdown

JOB VACANCY:
${vacancy}`,
      },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return NextResponse.json(
        { error: 'AI generation failed' },
        { status: 502 }
      );
    }

    const result = await response.json();
    const markdown = result.content?.[0]?.text?.trim() || '';

    return NextResponse.json({ markdown });
  } catch (err) {
    console.error('CV tailor error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
