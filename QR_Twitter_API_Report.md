# @qrcoindotfun — Full Twitter Profile & API Reference

---

## Part 1: @qrcoindotfun Profile Info (Extracted from X.com)

### Account Details

| Field | Value |
|-------|-------|
| **Display Name** | $QR |
| **Handle** | @qrcoindotfun |
| **Verified** | Yes (blue checkmark) |
| **Bio** | "The onchain attention machine." |
| **Website** | [qrcoin.fun](https://qrcoin.fun) |
| **Joined** | March 2025 |
| **Posts** | ~7,655 |
| **Followers** | ~19.4K |
| **App** | [iOS App Store — $QR](https://apps.apple.com/us/app/%24qr/id6747148490) |

### What is $QR?

Based on the profile and recent tweets, $QR (QR Coin) is a **crypto/web3 project on Solana** built around a daily auction mechanism and QR codes. Key characteristics:

- **Tagline**: "The onchain attention machine"
- **iOS App**: Live in the App Store — users "get paid to discover something new, onchain, every day"
- **Daily Auctions**: The project runs daily QR code auctions (at least 400 consecutive auctions as of today). Winners get to point the $QR code to a URL of their choosing.
- **Auction Stats** (per tweet from @0FJAKE): Winning bids of at least $100 for 333 straight days, average bid ~$537, ATH bid was $12K
- **Ecosystem**: Connected to the Solana ecosystem (followed by Solana-related accounts like Solana Spaces, Solana ID)

### Recent Tweet Activity (April 10, 2026)

1. **Pinned Tweet (Feb 25, 2026)**: Announcing the QR app going live on the App Store with a welcome bonus. 105 replies, 159 reposts, 332 likes, 27K views.

2. **Latest Tweet (~25 min ago)**: "GOOD MORNING" — announcing Auction #400 details. @buildinseven leading with a $127 bid to point QR to a learnai site. Other bidders: @FerDJpoker, @0xhohenheim. Mentions "legendary clanker tokens" and @toady_hawk, @wydeorg.

3. **Retweet from @0FJAKE**: Celebrating Auction #400 milestone — highlighting that daily auctions have maintained $100+ winning bids for 333 straight days.

---

## Part 2: TwitterAPI.io — Complete API Reference

### Authentication

All requests require the `x-api-key` header:

```
x-api-key: YOUR_API_KEY
```

**Base URL**: `https://api.twitterapi.io`

**Example cURL**:
```bash
curl --location 'https://api.twitterapi.io/twitter/user/info?userName=qrcoindotfun' \
  --header 'x-api-key: YOUR_API_KEY'
```

### Pricing

| Resource | Cost |
|----------|------|
| Tweets | $0.15 / 1K tweets |
| User Profiles | $0.18 / 1K profiles |
| Followers | $0.15 / 1K followers |
| Minimum charge | $0.00015 per request |

**Performance**: Average response time ~700ms, supports up to 200 QPS per client.

---

### User Endpoints

| # | Endpoint | Method | Path | Description |
|---|----------|--------|------|-------------|
| 1 | **Get User Info** | GET | `/twitter/user/info?userName={screenName}` | Get user profile by screen name |
| 2 | **Batch Get User Info** | GET | `/twitter/user/batch_get_user_by_userids` | Get multiple users by user IDs |
| 3 | **Get User Timeline** | GET | `/twitter/user/timeline?userName={screenName}` | Get user timeline (includes retweets) |
| 4 | **Get User Last Tweets** | GET | `/twitter/user/last_tweets?userName={screenName}` | Get user's own tweets, sorted by created_at. Params: `userId`, `userName`, `cursor`, `includeReplies` (default: false). Returns up to 20 per page with pagination. |
| 5 | **Get User Followers** | GET | `/twitter/user/followers?userName={screenName}` | Get user's followers list |
| 6 | **Get User Followings** | GET | `/twitter/user/followings?userName={screenName}` | Get who a user follows |
| 7 | **Get User Mentions** | GET | `/twitter/user/mention?userName={screenName}` | Get tweets mentioning a user |
| 8 | **Check Follow Relationship** | GET | `/twitter/user/check_follow_relationship` | Check if one user follows another |
| 9 | **Search User** | GET | `/twitter/user/search?keyword={keyword}` | Search users by keyword |
| 10 | **Get Verified Followers** | GET | `/twitter/user/verified_followers?userName={screenName}` | Get verified followers |
| 11 | **Get User About** | GET | `/twitter/user/about?userName={screenName}` | Get user's "about" profile details |

### Tweet Endpoints

| # | Endpoint | Method | Path | Description |
|---|----------|--------|------|-------------|
| 1 | **Get Tweets by IDs** | GET | `/twitter/tweet/get_tweet_by_ids` | Fetch tweets by their IDs |
| 2 | **Get Tweet Replies** | GET | `/twitter/tweet/reply` | Get replies to a specific tweet |
| 3 | **Get Tweet Replies V2** | GET | `/twitter/tweet/replies_v2` | V2 endpoint for tweet replies |
| 4 | **Get Tweet Quotations** | GET | `/twitter/tweet/quote` | Get quote tweets of a tweet |
| 5 | **Get Tweet Retweeters** | GET | `/twitter/tweet/retweeter` | Get users who retweeted a tweet |
| 6 | **Get Tweet Thread Context** | GET | `/twitter/tweet/thread_context` | Get full thread context |
| 7 | **Get Article** | GET | `/twitter/tweet/article` | Get Twitter article content |
| 8 | **Advanced Search** | GET | `/twitter/tweet/advanced_search` | Advanced tweet search. Params: `query` (required, supports Twitter search syntax like `from:user since:date`), `queryType` (Latest or Top), `cursor`. Returns up to 20 tweets per page. |

### List Endpoints

| # | Endpoint | Method | Path |
|---|----------|--------|------|
| 1 | **Get List Timeline** | GET | `/twitter/list/timeline` |
| 2 | **Get List Followers** | GET | `/twitter/list/followers` |
| 3 | **Get List Members** | GET | `/twitter/list/members` |

### Communities Endpoints

| # | Endpoint | Method | Path |
|---|----------|--------|------|
| 1 | **Get Community Info** | GET | `/twitter/community/by_id` |
| 2 | **Get Community Members** | GET | `/twitter/community/members` |
| 3 | **Get Community Moderators** | GET | `/twitter/community/moderators` |
| 4 | **Get Community Tweets** | GET | `/twitter/community/tweets` |
| 5 | **Search All Community Tweets** | GET | `/twitter/community/all_tweets` |

### Trend & Spaces Endpoints

| # | Endpoint | Method | Path |
|---|----------|--------|------|
| 1 | **Get Trends** | GET | `/twitter/trends` |
| 2 | **Get Space Detail** | GET | `/twitter/space/detail` |

### Post & Action Endpoints (V2)

These require account login first. Available actions:

| # | Endpoint | Method | Path |
|---|----------|--------|------|
| 1 | **Log In** | POST | `/twitter/user/login_v2` |
| 2 | **Create/Reply Tweet** | POST | `/twitter/tweet/create_v2` |
| 3 | **Delete Tweet** | POST | `/twitter/tweet/delete_v2` |
| 4 | **Like Tweet** | POST | `/twitter/tweet/like_v2` |
| 5 | **Unlike Tweet** | POST | `/twitter/tweet/unlike_v2` |
| 6 | **Retweet** | POST | `/twitter/tweet/retweet_v2` |
| 7 | **Bookmark Tweet** | POST | `/twitter/tweet/bookmark_v2` |
| 8 | **Unbookmark Tweet** | POST | `/twitter/tweet/unbookmark_v2` |
| 9 | **Get Bookmarks** | POST | `/twitter/tweet/bookmarks_v2` |
| 10 | **Follow User** | POST | `/twitter/user/follow_v2` |
| 11 | **Unfollow User** | POST | `/twitter/user/unfollow_v2` |
| 12 | **Send DM** | POST | `/twitter/user/send_dm_v2` |
| 13 | **Upload Media** | POST | `/twitter/media/upload_v2` |
| 14 | **Update Avatar** | PATCH | `/twitter/user/update_avatar_v2` |
| 15 | **Update Banner** | PATCH | `/twitter/user/update_banner_v2` |
| 16 | **Update Profile** | PATCH | `/twitter/user/update_profile_v2` |

### Community Action Endpoints (V2)

| # | Endpoint | Method | Path |
|---|----------|--------|------|
| 1 | **Create Community** | POST | `/twitter/community/create_v2` |
| 2 | **Delete Community** | POST | `/twitter/community/delete_v2` |
| 3 | **Join Community** | POST | `/twitter/community/join_v2` |
| 4 | **Leave Community** | POST | `/twitter/community/leave_v2` |

### Webhook/Websocket Filter Rules

| # | Endpoint | Method | Path |
|---|----------|--------|------|
| 1 | **Add Filter Rule** | POST | `/twitter/webhook/rule/add` |
| 2 | **Get All Rules** | GET | `/twitter/webhook/rule/list` |
| 3 | **Update Rule** | POST | `/twitter/webhook/rule/update` |
| 4 | **Delete Rule** | DELETE | `/twitter/webhook/rule/delete` |

### Stream/Monitor Endpoints

| # | Endpoint | Method | Path |
|---|----------|--------|------|
| 1 | **Add User to Monitor** | POST | `/twitter/stream/user/add` |
| 2 | **Remove User from Monitor** | POST | `/twitter/stream/user/remove` |
| 3 | **Get Monitored Users** | GET | `/twitter/stream/user/list` |

---

## Quick-Start Examples for @qrcoindotfun

### Get Profile Info
```bash
curl -s -H "x-api-key: YOUR_KEY" \
  "https://api.twitterapi.io/twitter/user/info?userName=qrcoindotfun"
```

### Get Latest Tweets
```bash
curl -s -H "x-api-key: YOUR_KEY" \
  "https://api.twitterapi.io/twitter/user/last_tweets?userName=qrcoindotfun"
```

### Get Followers
```bash
curl -s -H "x-api-key: YOUR_KEY" \
  "https://api.twitterapi.io/twitter/user/followers?userName=qrcoindotfun"
```

### Search Tweets About $QR
```bash
curl -s -H "x-api-key: YOUR_KEY" \
  "https://api.twitterapi.io/twitter/tweet/advanced_search?query=%24QR%20qrcoindotfun&queryType=Latest"
```

### Get Mentions
```bash
curl -s -H "x-api-key: YOUR_KEY" \
  "https://api.twitterapi.io/twitter/user/mention?userName=qrcoindotfun"
```

### Monitor Account for New Tweets (Real-time)
```bash
curl -s -X POST -H "x-api-key: YOUR_KEY" \
  "https://api.twitterapi.io/twitter/stream/user/add" \
  -d '{"userName": "qrcoindotfun"}'
```

---

*Report generated on April 10, 2026*
