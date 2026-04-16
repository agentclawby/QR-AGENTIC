interface RuntimePromptOptions {
  systemPrompt: string;
  personalityOverlay?: string | null;
  trainingOverlay?: string | null;
  refinementOverlay?: string | null;
  modeInstructions?: string | null;
}

function appendPromptSection(
  sections: string[],
  label: string,
  value?: string | null
) {
  const trimmed = value?.trim();
  if (!trimmed) return;
  sections.push(`${label}:\n${trimmed}`);
}

export function buildRuntimePrompt(options: RuntimePromptOptions) {
  const sections = [options.systemPrompt.trim()];

  appendPromptSection(
    sections,
    "VOICE AND IDENTITY OVERLAY",
    options.personalityOverlay
  );
  appendPromptSection(
    sections,
    "TRAINING CONTEXT",
    options.trainingOverlay
  );
  appendPromptSection(
    sections,
    "REFINEMENT OVERLAY",
    options.refinementOverlay
  );
  appendPromptSection(
    sections,
    "CURRENT TASK MODE",
    options.modeInstructions
  );

  return sections.join("\n\n");
}

export function cleanJsonResponse(text: string) {
  return text.replace(/```json\n?|\n?```/g, "").trim();
}
