const TWITTERAPI_BASE_URL = "https://api.twitterapi.io";

// In-process LRU + circuit breaker. The LRU absorbs accidental duplicate
// fetches in the same request lifecycle (60s/100 entries). The circuit
// breaker stops upstream calls once the global daily call count exceeds
// TWITTERAPI_DAILY_BUDGET — a soft ceiling that protects against runaway
// usage even when per-user caps are misconfigured.
const RECENT_TWEETS_TTL_MS = 60_000;
const RECENT_TWEETS_MAX = 100;
const recentTweetsCache = new Map<
  string,
  { value: RecentTweetsResult; expiresAt: number }
>();

let circuitBreakerDay = "";
let circuitBreakerCount = 0;

export class TwitterApiBudgetError extends Error {
  status = 503;
  constructor(public used: number, public limit: number) {
    super(
      `TwitterAPI.io daily call budget reached (${used}/${limit}). Try again after the budget resets.`,
    );
    this.name = "TwitterApiBudgetError";
  }
}

function bumpCircuitBreaker() {
  const today = new Date().toISOString().slice(0, 10);
  if (circuitBreakerDay !== today) {
    circuitBreakerDay = today;
    circuitBreakerCount = 0;
  }
  const limitRaw = process.env.TWITTERAPI_DAILY_BUDGET;
  const limit = limitRaw ? Number(limitRaw) : Infinity;
  if (Number.isFinite(limit) && circuitBreakerCount >= limit) {
    throw new TwitterApiBudgetError(circuitBreakerCount, limit);
  }
  circuitBreakerCount += 1;
}

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

// Classified errors so callers (and the UI) can react appropriately:
//   429 → user-visible "rate limited" with retry-after surface
//   401/403 → operator-only "auth failed", do not retry
//   5xx / network timeout → transient, retried with backoff
//   anything else → bubbled up as generic
export class TwitterApiAuthError extends Error {
  status = 401;
  constructor(message: string) {
    super(message);
    this.name = "TwitterApiAuthError";
  }
}
export class TwitterApiRateLimitError extends Error {
  status = 429;
  constructor(public retryAfterMs: number, message: string) {
    super(message);
    this.name = "TwitterApiRateLimitError";
  }
}
export class TwitterApiTransientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "TwitterApiTransientError";
  }
}

const REQUEST_TIMEOUT_MS = 15_000;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];

async function twitterApiFetch<T>(path: string): Promise<T> {
  bumpCircuitBreaker();

  let lastError: unknown = null;

  // Three attempts total; first attempt then up to 2 retries on transient
  // failures (5xx, fetch abort, malformed JSON). 429 with Retry-After is
  // honoured as a single sleep; auth errors short-circuit immediately.
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(`${TWITTERAPI_BASE_URL}${path}`, {
        headers: getTwitterApiHeaders(),
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(
        `[twitterapi] attempt ${attempt + 1} network failure on ${path}: ${reason}`
      );
      lastError = new TwitterApiTransientError(0, `Network error: ${reason}`);
      const sleep = RETRY_DELAYS_MS[attempt];
      if (attempt < RETRY_DELAYS_MS.length - 1) {
        await new Promise((r) => setTimeout(r, sleep));
        continue;
      }
      throw lastError;
    }
    clearTimeout(timer);

    if (response.ok) {
      try {
        return (await response.json()) as T;
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.warn(
          `[twitterapi] attempt ${attempt + 1} malformed JSON on ${path}: ${reason}`
        );
        lastError = new TwitterApiTransientError(
          response.status,
          `Malformed JSON: ${reason}`
        );
        if (attempt < RETRY_DELAYS_MS.length - 1) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
          continue;
        }
        throw lastError;
      }
    }

    const status = response.status;
    const body = await response.text().catch(() => "");
    console.warn(
      `[twitterapi] attempt ${attempt + 1} ${status} on ${path}: ${body.slice(0, 200)}`
    );

    // Auth errors are not retryable — operator misconfiguration.
    if (status === 401 || status === 403) {
      throw new TwitterApiAuthError(
        `twitterapi.io auth failed (${status}): ${body.slice(0, 200) || response.statusText}`
      );
    }
    // Rate limit: respect Retry-After, then retry once more.
    if (status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      const retryAfterMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 30_000)
        : RETRY_DELAYS_MS[attempt];
      lastError = new TwitterApiRateLimitError(
        retryAfterMs,
        `twitterapi.io rate limited (429); retry after ${retryAfterMs}ms`
      );
      if (attempt < RETRY_DELAYS_MS.length - 1) {
        await new Promise((r) => setTimeout(r, retryAfterMs));
        continue;
      }
      throw lastError;
    }
    // 5xx and others → transient, retry.
    if (status >= 500) {
      lastError = new TwitterApiTransientError(
        status,
        `twitterapi.io ${status}: ${body.slice(0, 200) || response.statusText}`
      );
      if (attempt < RETRY_DELAYS_MS.length - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
        continue;
      }
      throw lastError;
    }
    // 4xx (other than auth/rate): client error, don't retry.
    throw new Error(
      `twitterapi.io request failed (${status}): ${body || response.statusText}`
    );
  }

  // All retries exhausted (shouldn't reach here unless every iteration
  // continued without throwing, which RETRY_DELAYS_MS bounds prevent).
  throw lastError instanceof Error
    ? lastError
    : new Error("twitterapi.io retries exhausted");
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

export async function fetchTweetById(
  tweetId: string,
): Promise<{ raw: Record<string, unknown>; normalized: NormalizedTweet | null }> {
  const payload = await twitterApiFetch<Record<string, unknown>>(
    `/twitter/tweets?tweet_ids=${encodeURIComponent(tweetId)}`,
  );

  const candidates =
    (payload.tweets as Record<string, unknown>[] | undefined) ??
    (payload.data as Record<string, unknown>[] | undefined) ??
    [];

  const raw = candidates[0] ?? {};
  return {
    raw,
    normalized: candidates[0] ? normalizeTweet(raw) : null,
  };
}

export async function fetchRecentTweets(
  userName: string,
  limit: number = 20
): Promise<RecentTweetsResult> {
  const cacheKey = `${userName.toLowerCase()}:${limit}`;
  const cached = recentTweetsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

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

    const explicitCursor =
      typeof payload.cursor === "string"
        ? payload.cursor
        : typeof (payload as { next_cursor?: string }).next_cursor === "string"
          ? (payload as { next_cursor?: string }).next_cursor!
          : null;

    const hasNextPage = (payload as { has_next_page?: boolean }).has_next_page;

    // Stop if API explicitly says no more pages.
    if (hasNextPage === false) break;
    // If the API returned no batch, no further calls are productive.
    if (batch.length === 0) break;
    // Need a cursor to advance — without one, breaking avoids an infinite loop
    // hitting the same first page repeatedly.
    if (!explicitCursor) break;
    cursor = explicitCursor;
  }

  const result = {
    raw: rawTweets.slice(0, limit),
    normalized: tweets.slice(0, limit),
  };

  if (recentTweetsCache.size >= RECENT_TWEETS_MAX) {
    const oldestKey = recentTweetsCache.keys().next().value;
    if (oldestKey) recentTweetsCache.delete(oldestKey);
  }
  recentTweetsCache.set(cacheKey, {
    value: result,
    expiresAt: Date.now() + RECENT_TWEETS_TTL_MS,
  });

  return result;
}
