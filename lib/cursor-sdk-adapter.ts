type CursorAgent = {
  send: (
    message: string,
    options?: { local?: { force?: boolean } },
  ) => Promise<CursorRun>;
  close: () => void;
};

type CursorRun = {
  stream: () => AsyncGenerator<CursorStreamEvent>;
  wait: () => Promise<{ result?: string }>;
};

type CursorStreamEvent = {
  type: string;
  message?: {
    content?: Array<{ type: string; text?: string }>;
  };
  text?: string;
};

type CursorSdk = {
  Agent: {
    create: (options: {
      apiKey?: string;
      model: { id: string };
      local: { cwd: string };
    }) => Promise<CursorAgent>;
  };
};

export async function runCursorPrompt(prompt: string) {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey || apiKey === "placeholder_for_later") {
    throw new Error("CURSOR_API_KEY is required to run the audit.");
  }

  const { Agent } = (await loadCursorSdk()) as CursorSdk;
  const agent = await Agent.create({
    apiKey,
    model: { id: process.env.CURSOR_MODEL ?? "composer-2" },
    local: { cwd: process.cwd() },
  });

  try {
    const run = await agent.send(prompt, { local: { force: true } });
    const streamedText = await collectRunText(run);
    const result = await run.wait();

    return streamedText || result.result || "";
  } finally {
    agent.close();
  }
}

async function collectRunText(run: CursorRun) {
  let text = "";

  for await (const event of run.stream()) {
    if (event.type === "assistant") {
      text +=
        event.message?.content
          ?.filter((block) => block.type === "text")
          .map((block) => block.text ?? "")
          .join("") ?? "";
    }

    if (event.type === "task" && event.text) {
      text += event.text;
    }
  }

  return text;
}

function loadCursorSdk() {
  const dynamicImport = new Function(
    "specifier",
    "return import(specifier)",
  ) as (specifier: string) => Promise<unknown>;

  return dynamicImport("@cursor/sdk");
}
