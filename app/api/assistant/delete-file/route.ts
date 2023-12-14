import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(req: NextRequest) {
  const { file } = await req.json();

  try {
    // Delete the file from the assistant
    const assistantFileDeletionResponse =
      await openai.beta.assistants.files.del(file.assistantId, file.id);

    // Delete the file from openai.files
    const openaiFileDeletionResponse = await openai.files.del(file.id);

    return NextResponse.json(
      {
        message: 'File deleted successfully',
        assistantFileDeletionResponse,
        openaiFileDeletionResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Assistant file deletion unsuccessful:', error);
    return NextResponse.json(
      {
        message: 'Assistant file deletion unsuccessful',
        error,
      },
      { status: 500 }
    );
  }
}