"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type Message = { type: "success" | "error"; text: string } | null;

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function isPdf(file: File) {
  return file.name.toLowerCase().endsWith(".pdf") && (!file.type || file.type === "application/pdf");
}

export default function Home() {
  const router = useRouter();
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function addFiles(files: FileList | File[]) {
    const accepted: File[] = [];
    for (const file of Array.from(files)) {
      if (!isPdf(file)) {
        setMessage({ type: "error", text: "Only PDF files accepted." });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setMessage({ type: "error", text: `${file.name} is larger than 10MB.` });
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length) {
      setUploadedFiles((current) => [...current, ...accepted]);
      setMessage(null);
    }
  }

  async function transcribeAudio(audio: Blob) {
    setIsTranscribing(true);
    const formData = new FormData();
    formData.set("audio", audio, "voice-context.webm");

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });
    const data = (await response.json()) as { text?: string; message?: string };

    setIsTranscribing(false);
    if (!response.ok) {
      setMessage({ type: "error", text: data.message ?? "Transcription failed." });
      return;
    }
    setVoiceTranscript((current) => [current, data.text].filter(Boolean).join(" ").trim());
  }

  async function toggleRecording() {
    if (isRecording) {
      recorderRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage({ type: "error", text: "Microphone recording is not supported in this browser." });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        void transcribeAudio(new Blob(chunksRef.current, { type: "audio/webm" }));
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setMessage(null);
    } catch {
      setMessage({ type: "error", text: "Microphone access failed. Please try again." });
    }
  }

  async function submit() {
    if (!uploadedFiles.length) return;
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.set("voiceTranscript", voiceTranscript);
    uploadedFiles.forEach((file) => formData.append("files", file));

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const data = (await response.json()) as { message?: string; uploadId?: string };

    setIsLoading(false);
    if (!response.ok) {
      setMessage({ type: "error", text: data.message ?? "Upload failed. Please try again." });
      return;
    }

    if (!data.uploadId) {
      setMessage({ type: "error", text: "Audit was saved but no upload ID was returned." });
      return;
    }

    setVoiceTranscript("");
    setUploadedFiles([]);
    router.push(`/audit/${data.uploadId}`);
  }

  return (
    <main className="min-h-screen bg-[#f5fbfa] px-4 py-6 text-[#063b43] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl flex-col justify-center">
        <header className="mb-5 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#0a6b70]">
            Financial audit
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[#083b43] sm:text-5xl">
            Tell us what to audit
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-[#6f898d]">
            Add optional context: salary, rent, bills, debts, savings goals, and
            what feels expensive about London.
          </p>
        </header>

        <section
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addFiles(event.dataTransfer.files);
          }}
          className="rounded-[1.75rem] border border-[#dcebe9] bg-white p-3 shadow-[0_30px_100px_rgba(6,59,67,0.12)]"
        >
          <textarea
            value={voiceTranscript}
            onChange={(event) => setVoiceTranscript(event.target.value)}
            placeholder="Example: salary range, rent, bills, debts, savings target, spending worries, subscriptions, commute costs, dependants, and what you want to improve."
            className="min-h-44 w-full resize-none rounded-[1.25rem] bg-[#fbfffe] p-4 text-sm font-medium leading-6 text-[#083b43] outline-none placeholder:text-[#90a8ab]"
          />

          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2 pb-3">
              {uploadedFiles.map((file, index) => (
                <span
                  key={`${file.name}-${index}`}
                  className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#eef7f6] px-3 py-2 text-xs font-black text-[#527176]"
                >
                  <span className="truncate">✓ {file.name}</span>
                  <span className="text-[#90a8ab]">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setUploadedFiles((files) =>
                        files.filter((_, fileIndex) => fileIndex !== index),
                      )
                    }
                    className="text-[#083b43]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {(isRecording || isTranscribing) && (
            <div className="mx-2 mb-3 rounded-full bg-[#e2f3f1] px-3 py-2 text-sm font-black text-[#0a6b70]">
              {isRecording ? "Listening..." : "Transcribing with OpenAI..."}
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-[1.25rem] bg-[#f5fbfa] p-2 sm:flex-row sm:items-center">
            <div className="flex flex-1 gap-2">
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isTranscribing}
                className={`rounded-full px-4 py-3 text-sm font-black transition ${
                  isRecording
                    ? "bg-[#ef4444] text-white"
                    : "bg-white text-[#073f4a] shadow-sm hover:bg-[#eef7f6] disabled:text-[#90a8ab]"
                }`}
              >
                {isTranscribing ? "..." : isRecording ? "Stop" : "Record"}
              </button>

              <label className="cursor-pointer rounded-full bg-white px-4 py-3 text-sm font-black text-[#073f4a] shadow-sm transition hover:bg-[#eef7f6]">
                PDFs
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  className="sr-only"
                  onChange={(event) => event.target.files && addFiles(event.target.files)}
                />
              </label>

              {(voiceTranscript || uploadedFiles.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setVoiceTranscript("");
                    setUploadedFiles([]);
                  }}
                  className="rounded-full px-4 py-3 text-sm font-black text-[#6f898d] hover:bg-white"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!uploadedFiles.length || isLoading}
              className="flex items-center justify-center gap-2 rounded-full bg-[#073f4a] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0a5663] disabled:cursor-not-allowed disabled:bg-[#d8e8e6] disabled:text-[#90a8ab]"
            >
              {isLoading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {isLoading ? "Analyzing" : "Start audit"}
            </button>
          </div>
        </section>

        <p className="mt-3 text-center text-xs font-bold text-[#90a8ab]">
          Drop PDFs anywhere on the box. No screenshots or Word docs.
        </p>

        {message && (
          <div
            className={`mt-4 rounded-2xl border p-4 text-sm font-black ${
              message.type === "success"
                ? "border-[#9be6d7] bg-[#e7faf6] text-[#087064]"
                : "border-[#fecaca] bg-[#fff1f2] text-[#be123c]"
            }`}
          >
            {message.type === "success" ? "✓ " : ""}
            {message.text}
          </div>
        )}
      </div>
    </main>
  );
}
