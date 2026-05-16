// X v2 tweet posting. Server-only.

import "server-only";

const X_API_TWEETS = "https://api.x.com/2/tweets";

export interface PostTweetResult {
  id: string;
  text: string;
}

export interface PostTweetOptions {
  // When set, the tweet posts as a reply to this tweet id. X auto-prepends the
  // parent author's mention; do NOT include "@handle" in `content`.
  inReplyToTweetId?: string | null;
}

export class XPostError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "XPostError";
  }
}

export async function postTweet(
  accessToken: string,
  content: string,
  options: PostTweetOptions = {}
): Promise<PostTweetResult> {
  const trimmed = content.trim();
  if (!trimmed) throw new XPostError(400, "Empty tweet body");
  if (trimmed.length > 280) {
    throw new XPostError(400, `Tweet exceeds 280 chars (${trimmed.length})`);
  }

  const payload: Record<string, unknown> = { text: trimmed };
  if (options.inReplyToTweetId) {
    payload.reply = { in_reply_to_tweet_id: options.inReplyToTweetId };
  }

  const res = await fetch(X_API_TWEETS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new XPostError(
      res.status,
      `X API ${res.status}: ${body.slice(0, 240) || res.statusText}`
    );
  }

  const json = (await res.json()) as { data?: { id?: string; text?: string } };
  if (!json.data?.id) {
    throw new XPostError(502, "X API returned no tweet id");
  }
  return { id: json.data.id, text: json.data.text ?? trimmed };
}
