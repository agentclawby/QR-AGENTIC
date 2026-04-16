import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { cleanJsonResponse } from "@/lib/ai/runtime-prompt";
import type { NormalizedTweet } from "@/lib/x/twitterapi";

export interface ExtractedPersonalityTraits {
  tone: string[];
  topicClusters: string[];
  vocabularyPatterns: string[];
  stanceMarkers: string[];
  tabooPhrases: string[];
  cadence: string;
  examples: string[];
}

interface ExtractedPersonalityPayload {
  traits: ExtractedPersonalityTraits;
  overlay: string;
}

export async function extractXPersonality(options: {
  handle: string;
  bio?: string | null;
  tweets: NormalizedTweet[];
}): Promise<ExtractedPersonalityPayload> {
  const tweetSample = options.tweets
    .slice(0, 80)
    .map((tweet, index) => `${index + 1}. ${tweet.text}`)
    .join("\n");

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `You analyze public X posts and extract voice characteristics for an AI agent overlay.
Return ONLY valid JSON. Do not wrap in markdown.`,
    prompt: `Analyze the following X account and build a voice overlay for an AI agent.

Handle: @${options.handle}
Bio: ${options.bio ?? "No bio provided"}

Tweet sample:
${tweetSample}

Return this exact JSON shape:
{
  "traits": {
    "tone": ["3-6 short descriptors"],
    "topicClusters": ["4-8 recurring topics"],
    "vocabularyPatterns": ["4-8 notable words or phrasing habits"],
    "stanceMarkers": ["3-6 repeated conviction markers or views"],
    "tabooPhrases": ["0-5 things the agent should avoid saying"],
    "cadence": "1-2 sentence description of post rhythm and sentence shape",
    "examples": ["3-5 short example lines that sound like the user"]
  },
  "overlay": "A concise instruction block in second person that tells an AI how to sound like this user while staying useful and credible. Mention tone, cadence, recurring topics, what to avoid, and how to handle uncertainty."
}`,
    maxOutputTokens: 1400,
  });

  try {
    return JSON.parse(cleanJsonResponse(text)) as ExtractedPersonalityPayload;
  } catch {
    return {
      traits: {
        tone: ["direct", "opinionated", "crypto-native"],
        topicClusters: ["markets", "tokens", "narratives"],
        vocabularyPatterns: ["short lines", "conviction phrases"],
        stanceMarkers: ["high-signal only", "calls out weak arguments"],
        tabooPhrases: ["avoid generic corporate language"],
        cadence: "Short, high-conviction lines with quick pivots into specifics.",
        examples: options.tweets.slice(0, 3).map((tweet) => tweet.text.slice(0, 160)),
      },
      overlay:
        "Speak with crisp conviction, short lines, and crypto-native specificity. Stay direct, useful, and pointed. Avoid sounding generic, padded, or over-explained.",
    };
  }
}
