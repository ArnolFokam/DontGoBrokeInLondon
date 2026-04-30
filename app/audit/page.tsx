"use client";

import { useRef, useState } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type Message = { type: "success" | "error"; text: string } | null;
type SpeechRecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function isPdf(file: File) {
  return file.name.toLowerCase().endsWith(".pdf") && (!file.type || file.type === "application/pdf");
}

export default function Home() {
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition =
      (window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor })
        .SpeechRecognition ??
      (window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor })
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage({ type: "error", text: "Voice input is not supported in this browser." });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceTranscript((current) => `${current} ${transcript}`.trim());
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => recognition.stop(), 2000);
    };
    recognition.onerror = () => setMessage({ type: "error", text: "Microphone access failed. Please try again." });
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  }

  async function submit() {
    if (!uploadedFiles.length) return;
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.set("voiceTranscript", voiceTranscript);
    uploadedFiles.forEach((file) => formData.append("files", file));

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const data = (await response.json()) as { message?: string };

    setIsLoading(false);
    if (!response.ok) {
      setMessage({ type: "error", text: data.message ?? "Upload failed. Please try again." });
      return;
    }

    setVoiceTranscript("");
    setUploadedFiles([]);
    setMessage({
      type: "success",
      text: "Your documents are being analyzed. Check back soon for your financial audit.",
    });
  }

  return (
    <main className="min-h-screen bg-[#f5fbfa] px-4 py-5 text-[#063b43] sm:px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#f8fffe] shadow-[0_30px_100px_rgba(6,59,67,0.12)]">
        <nav className="flex items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-2 text-sm font-black">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#073f4a] text-white">
              £
            </span>
            Don&apos;t Go Broke
          </div>
          <div className="hidden gap-8 text-xs font-semibold text-[#527176] sm:flex">
            <span>Audit</span>
            <span>Upload</span>
            <span>Advice</span>
          </div>
          <button className="rounded-full bg-[#073f4a] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#0a5663]">
            Start
          </button>
        </nav>

        <section className="grid gap-8 px-5 pb-10 pt-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-7">
            <p className="w-fit rounded-full bg-[#e2f3f1] px-4 py-2 text-xs font-bold text-[#0a6b70]">
              AI financial audit for London life
            </p>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-[-0.04em] text-[#083b43] sm:text-7xl">
                Don&apos;t Go Broke in London
              </h1>
              <p className="max-w-xl text-base leading-7 text-[#527176] sm:text-lg">
                What if an agent could audit your finances and give you
                financially savvy tips to thrive in one of the most expensive
                cities in the world?
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-bold text-[#527176]">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">Bank statements</span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">Revolut exports</span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">Claude analysis</span>
            </div>
          </div>

          <div className="relative min-h-[340px]">
            <div className="absolute right-0 top-2 w-72 rounded-[2rem] bg-white p-5 shadow-[0_25px_70px_rgba(6,59,67,0.14)]">
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-[#dff4f1] px-3 py-1 text-xs font-bold text-[#0a6b70]">
                  London audit
                </span>
                <span className="text-xs font-bold text-[#90a8ab]">PDF</span>
              </div>
              <p className="text-3xl font-black tracking-tight">£2,850</p>
              <p className="mt-1 text-xs text-[#6f898d]">Monthly city burn estimate</p>
              <div className="mt-6 h-28 rounded-2xl bg-gradient-to-br from-[#0d7f83] to-[#073f4a] p-4 text-white">
                <p className="text-xs opacity-70">Insight card</p>
                <p className="mt-8 text-sm font-bold">Transport, rent, food</p>
              </div>
            </div>
            <div className="absolute bottom-2 left-0 w-64 rounded-[1.75rem] bg-[#073f4a] p-5 text-white shadow-[0_25px_70px_rgba(6,59,67,0.22)]">
              <p className="text-sm text-white/70">Financial readiness</p>
              <p className="mt-3 text-4xl font-black">3 PDFs</p>
              <div className="mt-5 h-2 rounded-full bg-white/10">
                <div className="h-2 w-2/3 rounded-full bg-[#4bd2c2]" />
              </div>
            </div>
            <div className="absolute bottom-24 right-10 rounded-2xl bg-[#e9f7f5] px-5 py-4 text-sm font-bold text-[#0a6b70] shadow-sm">
              No screenshots. PDFs only.
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-10 sm:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-[1.75rem] border border-[#dcebe9] bg-[#fbfffe] p-5">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e2f3f1] text-xl">
                🎙
              </div>
              <h2 className="text-xl font-black">Tell us about yourself</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f898d]">
                Name, goals, income context, debt, savings, and London money
                worries.
              </p>
              <button
                type="button"
                onClick={toggleRecording}
                className={`mt-5 rounded-full px-5 py-3 text-sm font-black transition ${
                  isRecording
                    ? "bg-[#ef4444] text-white"
                    : "bg-[#073f4a] text-white hover:bg-[#0a5663]"
                }`}
              >
                {isRecording ? "Stop recording" : "Record voice memo"}
              </button>
              {isRecording && (
                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-[#ef4444]">
                  <span className="h-3 w-3 animate-ping rounded-full bg-[#ef4444]" />
                  Listening...
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-[#dcebe9] bg-[#fbfffe] p-5 lg:col-span-2">
              <textarea
                value={voiceTranscript}
                onChange={(event) => setVoiceTranscript(event.target.value)}
                placeholder="Your voice transcription will appear here. You can edit it before submitting."
                className="min-h-44 w-full resize-none rounded-[1.25rem] border border-[#dcebe9] bg-white p-4 text-[#083b43] outline-none transition placeholder:text-[#90a8ab] focus:border-[#0d7f83]"
              />
              <button
                type="button"
                onClick={() => setVoiceTranscript("")}
                className="mt-3 rounded-full bg-[#eef7f6] px-4 py-2 text-sm font-bold text-[#527176] transition hover:bg-[#e2f3f1]"
              >
                Clear voice context
              </button>
            </div>
          </div>
        </section>

        <section className="bg-[#073f4a] px-5 py-10 text-white sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-bold text-[#85d8cf]">Upload</p>
              <h2 className="mt-2 max-w-sm text-3xl font-black tracking-tight">
                Add your financial history, PDFs only.
              </h2>
              <p className="mt-4 text-sm leading-6 text-white/65">
                Upload bank statements, credit card statements, Revolut exports,
                and similar documents. No images or screenshots.
              </p>
            </div>

            <div>
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  addFiles(event.dataTransfer.files);
                }}
                className="rounded-[1.75rem] border border-dashed border-[#74cfc6]/70 bg-[#0a4b56] p-8 text-center transition hover:bg-[#0b5662]"
              >
                <p className="text-lg font-black">Drag PDFs here</p>
                <p className="mt-2 text-sm text-white/60">Max 10MB per file</p>
                <label className="mt-5 inline-flex cursor-pointer rounded-full bg-[#4bd2c2] px-5 py-3 text-sm font-black text-[#063b43] transition hover:bg-[#74e2d6]">
                  Choose PDFs
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    className="sr-only"
                    onChange={(event) => event.target.files && addFiles(event.target.files)}
                  />
                </label>
              </div>

              <div className="mt-5 flex items-center justify-between text-sm text-white/65">
                <span>{uploadedFiles.length} files uploaded</span>
                {uploadedFiles.length > 0 && (
                  <button type="button" onClick={() => setUploadedFiles([])} className="font-bold text-white">
                    Clear all
                  </button>
                )}
              </div>

              <div className="mt-3 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-3"
                  >
                    <div>
                      <p className="font-bold text-white">✓ {file.name}</p>
                      <p className="text-sm text-white/55">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setUploadedFiles((files) =>
                          files.filter((_, fileIndex) => fileIndex !== index),
                        )
                      }
                      className="rounded-full bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-8 sm:px-8">
          {message && (
            <div
              className={`mb-5 rounded-2xl border p-4 text-sm font-bold ${
                message.type === "success"
                  ? "border-[#9be6d7] bg-[#e7faf6] text-[#087064]"
                  : "border-[#fecaca] bg-[#fff1f2] text-[#be123c]"
              }`}
            >
              {message.type === "success" ? "✓ " : ""}
              {message.text}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!uploadedFiles.length || isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-[1.25rem] bg-[#073f4a] px-6 py-4 text-base font-black text-white transition hover:bg-[#0a5663] disabled:cursor-not-allowed disabled:bg-[#d8e8e6] disabled:text-[#90a8ab]"
          >
            {isLoading && (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {isLoading ? "Analyzing your finances..." : "Analyze My Finances"}
          </button>
        </section>
      </div>
    </main>
  );
}
