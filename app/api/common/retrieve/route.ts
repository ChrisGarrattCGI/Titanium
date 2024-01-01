import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/client/mongodb';
import OpenAI from 'openai';

const openai = new OpenAI();

export async function GET(req: NextRequest) {
  const userEmail = req.headers.get('userEmail');
  const serviceName = req.headers.get('serviceName');
  if (!userEmail) {
    return NextResponse.json(
      { message: 'userEmail header is required' },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<IUser>('users');
    const user = await usersCollection.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (serviceName === 'assistant' && user.assistantId) {
      const [assistant, thread, fileList] = await Promise.all([
        openai.beta.assistants.retrieve(user.assistantId),
        openai.beta.threads.retrieve(user.threadId as string),
        openai.beta.assistants.files.list(user.assistantId),
      ]);

      const filesWithNames = await Promise.all(
        fileList.data.map(async (fileObject) => {
          const file = await openai.files.retrieve(fileObject.id);
          return {
            id: fileObject.id,
            name: file.filename,
            assistantId: user.assistantId,
          };
        })
      );

      return NextResponse.json(
        {
          message: 'Assistant retrieved',
          assistant,
          threadId: thread?.id,
          fileList: filesWithNames,
          isAssistantEnabled: user.isAssistantEnabled,
        },
        { status: 200 }
      );
    } else if (serviceName === 'vision' && user.visionId) {
      const fileCollection = db.collection<IFiles>('files');

      const visionFileList = await fileCollection
        .find({ visionId: user.visionId })
        .toArray();

      return NextResponse.json(
        {
          message: 'Vision updated',
          visionId: user.visionId,
          visionFileList,
          isVisionEnabled: user.isVisionEnabled,
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { message: 'No assistant found for the user' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error retrieving assistant:', error);
    return NextResponse.json(
      { message: 'Error retrieving assistant', error: error.message },
      { status: 500 }
    );
  }
}