import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(
  req: Request,
  { params }: { params: { entryId: string } }
) {
  const supabase = createClient();
  const { entryId } = params;

  const { data: entry } = await supabase
    .from("entries")
    .select("audio_url")
    .eq("id", entryId)
    .single();

  if (!entry)
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  await supabase
    .from("entries")
    .update({ transcription_status: "processing" })
    .eq("id", entryId);

  try {
    const response = await fetch(entry.audio_url);
    const audioBlob = await response.blob();
    const file = new File([audioBlob], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "mr",
    });

    const marathiText = transcription.text;

    // translate to english
    const translation = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful translator. Translate the following Marathi text to English. Preserve the tone and nuance.",
        },
        { role: "user", content: marathiText },
      ],
    });

    const englishText = translation.choices[0].message.content;

    await supabase
      .from("entries")
      .update({
        transcript_mr: marathiText,
        transcript_en: englishText,
        transcription_status: "done",
        transcription_provider: "openai",
      })
      .eq("id", entryId);

    return NextResponse.json({ status: "done" });
  } catch (error) {
    console.error(error);
    await supabase
      .from("entries")
      .update({
        transcription_status: "failed",
        transcription_error: String(error),
      })
      .eq("id", entryId);

    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
