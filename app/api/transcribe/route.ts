import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "placeholder_for_later") {
    return NextResponse.json(
      { message: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const audio = formData.get("audio");

  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json(
      { message: "Audio recording is required." },
      { status: 400 },
    );
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "gpt-4o-mini-transcribe",
    });

    return NextResponse.json({ text: transcription.text });
  } catch {
    return NextResponse.json(
      { message: "OpenAI transcription failed. Please try again." },
      { status: 500 },
    );
  }
}
