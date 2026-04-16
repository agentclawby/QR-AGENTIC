const TWITTERAPI_BASE_URL = "https://api.twitterapi.io";

export interface NormalizedTweet {
  id: string;
  text: string;
  createdAt: string | null;
  isReply: boolean;
  url?: string | null;
}

export interface RecentTweetsResult {
  raw: Record<string, unknown>[];
  normalized: NormalizedTweet[];
}

interface TwitterApiUser {
  id?: string;
  userName?: string;
  screenName?: string;
  name?: string;
  description?: string;
  profilePicture?: string;
  followers?: number;
}

interface TwitterApiInfoResponse {
  data?: TwitterApiUser;
  user?: TwitterApiUser;
}

function getTwitterApiHeaders() {
  const apiKey = process.env.TWITTERAPI_IO_KEY;
  if (!apiKey) {
    throw new Error("TWITTERAPI_IO_KEY is not configured");
  }

  return {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  };
}

async function twitterApiFetch<T>(path: string) {
  const response = await fetch(`${TWITTERAPI_BASE_URL}${path}`, {
    headers: getTwitterApiHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `twitterapi.io request failed (${response.status}): ${message || response.statusText}`
    );
  }

  return (await response.json()) as T;
}

function isPureRetweet(tweet: Record<string, unknown>) {
  if (tweet.retweeted_tweet || tweet.retweetedTweet || tweet.retweetedStatus) {
    return true;
  }

  if (
    typeof tweet.tweetType === "string" &&
    tweet.tweetType.toLowerCase().includes("retweet")
  ) {
    return true;
  }

  const rawText = extractTweetText(tweet);
  return rawText.startsWith("RT @");
}

function extractTweetText(tweet: Record<string, unknown>) {
  const candidates = [
    tweet.text,
    tweet.full_text,
    tweet.fullText,
    (tweet.note_tweet as { text?: string } | undefined)?.text,
    (tweet.legacy as { full_text?: string } | undefined)?.full_text,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return "";
}

function getArrayCandidate(payload: Record<string, unknown>) {
  const values = [
    payload.tweets,
    payload.data,
    (payload.data as { tweets?: unknown } | undefined)?.tweets,
    payload.timeline,
  ];

  return values.find(Array.isArray) as unknown[] | undefined;
}

function normalizeTweet(tweet: Record<string, unknown>): NormalizedTweet | null {
  const text = extractTweetText(tweet);
  const id =
    typeof tweet.id === "string"
      ? tweet.id
      : typeof tweet.tweetId === "string"
        ? tweet.tweetId
        : null;

  if (!id || !text || isPureRetweet(tweet)) {
    return null;
  }

  const replyTo =
    typeof tweet.inReplyToStatusId === "string" ||
    typeof tweet.inReplyToUserId === "string" ||
    typeof tweet.inReplyToScreenName === "string";

  return {
    id,
    text,
    createdAt:
      typeof tweet.createdAt === "string"
        ? tweet.createdAt
        : typeof tweet.created_at === "string"
          ? tweet.created_at
          : null,
    isReply: replyTo,
    url:
      typeof tweet.url === "string"
        ? tweet.url
        : typeof tweet.permanentUrl === "string"
          ? tweet.permanentUrl
          : null,
  };
}

export async function fetchTwitterUser(userName: string) {
  const payload = await twitterApiFetch<TwitterApiInfoResponse>(
    `/twitter/user/info?userName=${encodeURIComponent(userName)}`
  );

  return payload.data ?? payload.user ?? null;
}

export async function fetchRecentTweets(
  userName: string,
  limit: number = 80
): Promise<RecentTweetsResult> {
  const rawTweets: Record<string, unknown>[] = [];
  const tweets: NormalizedTweet[] = [];
  let cursor: string | null = null;

  while (tweets.length < limit) {
    const cursorQuery: string = cursor
      ? `&cursor=${encodeURIComponent(cursor)}`
      : "";
    const payload = await twitterApiFetch<Record<string, unknown>>(
      `/twitter/user/last_tweets?userName=${encodeURIComponent(
        userName
      )}&includeReplies=true${cursorQuery}`
    );

    const batch = (getArrayCandidate(payload) ?? []).filter(
      (tweet): tweet is Record<string, unknown> =>
        typeof tweet === "object" && tweet !== null
    );

    for (const rawTweet of batch) {
      const normalizedTweet = normalizeTweet(rawTweet);
      if (!normalizedTweet) continue;

      if (!tweets.some((existing) => existing.id === normalizedTweet.id)) {
        rawTweets.push(rawTweet);
        tweets.push(normalizedTweet);
      }
      if (tweets.length >= limit) break;
    }

    const nextCursor =
      typeof payload.cursor === "string"
        ? payload.cursor
        : typeof (payload as { next_cursor?: string }).next_cursor === "string"
          ? (payload as { next_cursor?: string }).next_cursor!
          : typeof (payload as { has_next_page?: boolean }).has_next_page ===
              "boolean" &&
            !(payload as { has_next_page?: boolean }).has_next_page
            ? null
            : null;

    if (!nextCursor || batch.length === 0) break;
    cursor = nextCursor;
  }

  return {
    raw: rawTweets.slice(0, limit),
    normalized: tweets.slice(0, limit),
  };
}
