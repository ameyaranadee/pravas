import { NextResponse } from "next/server";
import { SarvamAIClient } from "sarvamai";
import { createClient } from "@/lib/supabase/server";

const sarvam = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY!,
});

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params;
  const supabase = await createClient();

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
    // Fetch the audio from storage
    const audioResponse = await fetch(entry.audio_url);
    const audioBlob = await audioResponse.blob();
    const file = new File([audioBlob], "audio.webm", { type: "audio/webm" });

    // Step 1: Transcribe to Marathi
    const transcription = await sarvam.speechToText.transcribe({
      file,
      model: "saaras:v3",
      mode: "transcribe",
      language_code: "mr-IN",
    });

    const marathiText = transcription.transcript;

    // Step 2: Translate Marathi → English
    const translation = await sarvam.text.translate({
      input: marathiText,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      source_language_code: "mr-IN" as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target_language_code: "en-IN" as any,
      model: "sarvam-translate:v1",
    });

    const englishText = translation.translated_text;

    await supabase
      .from("entries")
      .update({
        transcript_mr: marathiText,
        transcript_en: englishText,
        transcription_status: "done",
        transcription_provider: "sarvam",
      })
      .eq("id", entryId);

    return NextResponse.json({ status: "done" });
  } catch (error) {
    console.error("Transcription error:", error);

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
