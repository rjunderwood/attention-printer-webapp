# Content Pipeline REST API

Base URL: `http://localhost:5000`

## Authentication

Set `API_KEYS` env var with comma-separated keys. If unset, auth is disabled.

```
API_KEYS=slack-bot-key,dashboard-key python api.py
```

All requests require:
```
Authorization: Bearer <key>
```

Returns `401` if invalid:
```json
{"error": "Unauthorized"}
```

---

## Campaigns

### GET /api/campaigns

List all available campaigns.

**Response:**
```json
{
  "campaigns": ["unlove", "focus-app"]
}
```

---

### GET /api/{campaign}/config

Campaign configuration metadata. Use this to populate dropdowns, display settings, and validate inputs.

**Response:**
```json
{
  "campaign": "unlove",
  "product": "Unlove App",
  "content_types": ["demo", "demo-reframe-check-social-media", "how-it-feels-to", "list", "meme"],
  "regions": ["AEST", "EST", "CET"],
  "platforms": ["tiktok", "instagram", "youtube"],
  "posts_per_day": 2,
  "rest_pattern": [true, true, false],
  "content_low_threshold": 8,
  "daily_cycle": {
    "enabled": true,
    "notification_hour": 19,
    "notification_minute": 0,
    "confirmation_window_minutes": 60
  }
}
```

---

## Plan

### GET /api/{campaign}/plan

Current plan and paused creators.

**Response:**
```json
{
  "campaign": "unlove",
  "plan": {
    "campaign": "unlove",
    "updated_at": "2026-03-18T19:20:00",
    "groups": [
      {"name": "est-demo", "content_types": ["demo-reframe-check-social-media"], "region": "EST"},
      {"name": "default", "content_types": ["meme"]}
    ]
  },
  "paused_creators": ["vanessa-a"]
}
```

The length of `content_types` determines the posts per day for that group. For example, `["meme", "demo-reframe"]` means 2 posts/day (one of each type).

---

### POST /api/{campaign}/plan/set

Add or update a plan group.

**Body:**
```json
{
  "content_types": ["meme", "demo-reframe-check-social-media"],
  "region": "EST",
  "count": 5,
  "group": "est-mixed"
}
```

| Field | Required | Description |
|---|---|---|
| `content_types` | Yes | List of content type names defined in `campaign.json`. Length = posts per day for this group. |
| `region` | No | Filter creators by region (`"EST"`, `"AEST"`, `"CET"`) |
| `count` | No | Limit number of creators in this group |
| `group` | No | Group name (defaults to first content type name, or `"default"`) |

All content types are validated against the campaign config. Unknown types return 400:
```json
{"error": "Unknown content type(s): fake-type. Available: demo, list, meme, ..."}
```

**Response:**
```json
{
  "message": "Updated group 'est-mixed'",
  "plan": {
    "campaign": "unlove",
    "updated_at": "2026-03-18T19:25:00",
    "groups": [
      {"name": "est-mixed", "content_types": ["meme", "demo-reframe-check-social-media"], "region": "EST", "count": 5},
      {"name": "default", "content_types": ["meme"]}
    ]
  }
}
```

---

### POST /api/{campaign}/plan/remove-group

Remove a specific group from the plan.

**Body:**
```json
{"group": "est-meme"}
```

**Response:**
```json
{
  "message": "Removed group 'est-meme'",
  "plan": {
    "campaign": "unlove",
    "updated_at": "2026-03-18T19:30:00",
    "groups": [
      {"name": "default", "content_types": ["meme"]}
    ]
  }
}
```

---

### POST /api/{campaign}/plan/reset

Reset to campaign default plan.

**Response:**
```json
{
  "message": "Plan reset to default",
  "plan": {
    "campaign": "unlove",
    "updated_at": "2026-03-18T19:30:00",
    "groups": [
      {"name": "default", "content_types": ["meme"]}
    ]
  }
}
```

---

### GET /api/{campaign}/plan/preview

Preview tomorrow's creator assignments with the current plan.

**Query params:**
- `date` (optional): `YYYY-MM-DD`, defaults to tomorrow

**Response:**
```json
{
  "campaign": "unlove",
  "date": "2026-03-19",
  "total": 30,
  "posting": 22,
  "resting": 7,
  "paused": 1,
  "groups": {
    "est-demo": [
      {"creator": "alice-c", "group": "est-demo", "content_types": ["demo-reframe-check-social-media"], "region": "EST", "action": "post"},
      {"creator": "jess-w", "group": "est-demo", "content_types": ["demo-reframe-check-social-media"], "region": "EST", "action": "post"}
    ],
    "default": [
      {"creator": "abby-m", "group": "default", "content_types": ["meme"], "region": "AEST", "action": "post"}
    ],
    "rest": [
      {"creator": "brooke-p", "group": "rest", "content_types": [], "region": "AEST", "action": "rest"}
    ],
    "paused": [
      {"creator": "vanessa-a", "group": "paused", "content_types": [], "region": "AEST", "action": "paused"}
    ]
  },
  "assignments": {
    "abby-m": {"group": "default", "content_types": ["meme"], "region": "AEST", "action": "post"},
    "alice-c": {"group": "est-demo", "content_types": ["demo-reframe-check-social-media"], "region": "EST", "action": "post"},
    "brooke-p": {"group": "rest", "content_types": [], "region": "AEST", "action": "rest"},
    "vanessa-a": {"group": "paused", "content_types": [], "region": "AEST", "action": "paused"}
  }
}
```

---

## Daily Cycle Confirmation

### GET /api/{campaign}/plan/status

Current daily cycle confirmation state.

**Response (pending):**
```json
{
  "target_date": "2026-03-19",
  "status": "pending",
  "notification_sent_at": "2026-03-18T19:00:05",
  "confirmed_at": null,
  "confirmed_by": null,
  "generation_started_at": null,
  "generation_completed_at": null,
  "creators_posting": 22,
  "creators_resting": 7,
  "creators_paused": 1
}
```

**Possible statuses:** `pending`, `confirmed`, `auto_confirmed`, `generating`, `complete`, `complete_with_failures`, `failed`

**Response (no active cycle):**
```json
{
  "status": "none",
  "message": "No active daily cycle state"
}
```

---

### POST /api/{campaign}/plan/confirm

Confirm the pending plan. Orchestrator picks it up on next pass (~60s).

**Body (optional):**
```json
{"refresh": true}
```

Use `refresh: true` after adjusting the plan to re-resolve assignments with the updated groups.

**Response (success):**
```json
{"message": "Confirmed plan for 2026-03-19"}
```

**Response (not pending):**
```json
{"error": "Status is 'complete', not 'pending'"}
```

---

## Creators

### GET /api/{campaign}/creators

List all creators with region and status.

**Response:**
```json
{
  "campaign": "unlove",
  "creators": [
    {"name": "abby-m", "region": "AEST", "status": "active", "profile_picture_url": "http://127.0.0.1:5000/api/unlove/creators/abby-m/profile-picture"},
    {"name": "bianca-b", "region": "AEST", "status": "account_warmup", "warmup_device": 3, "inactive_reason": "Unknown", "profile_picture_url": "http://127.0.0.1:5000/api/unlove/creators/bianca-b/profile-picture"},
    {"name": "vanessa-a", "region": "AEST", "status": "paused", "inactive_reason": "Text exhausted: meme", "profile_picture_url": "http://127.0.0.1:5000/api/unlove/creators/vanessa-a/profile-picture"}
  ]
}
```

The `warmup_device` field is only present for creators that have a device assigned (those in `account_warmup` or `posting_warmup` status).

The `status` field indicates the creator's current state. Possible values:
- `"active"` — fully active, posting normally
- `"posting_warmup"` — active but in posting warmup phase
- `"paused"` — temporarily paused from posting
- `"account_warmup"` — new account being warmed up
- `"pending"` — newly created, not yet set up
- `"archived"` — permanently retired

The `inactive_reason` field is only present when status is not `"active"` or `"posting_warmup"`. Possible values:
- `"Text exhausted: {content_type}"` — auto-paused by orchestrator when text pack ran out
- `"Permanent error: {error_message}"` — auto-paused due to platform error (e.g., account restricted)
- `"Manually paused"` — paused via API or CLI
- `"Unknown"` — paused before reason tracking was added

---

### GET /api/{campaign}/creators/{name}/profile-picture

Serve a creator's profile picture as a JPEG image. Can be used directly in `<img>` tags. This endpoint is exempt from authentication so browsers can load images directly.

**Response:** `image/jpeg` binary data (200), or 404 if no profile picture exists.

The `profile_picture_url` returned by `GET /api/{campaign}/creators` is an absolute URL pointing to this endpoint, so it can be used directly as an `<img src>`.

---

### POST /api/{campaign}/creators/{name}/pause

Pause a creator. They'll be excluded from future daily cycles.

**Body (optional):**
```json
{"reason": "Account under review"}
```

If no reason is provided, defaults to `"Manually paused"`.

**Response:**
```json
{"message": "Paused 'vanessa-a'"}
```

---

### POST /api/{campaign}/creators/{name}/resume

Resume a paused creator.

**Response:**
```json
{"message": "Resumed 'vanessa-a'"}
```

---

## Warmup

### POST /api/{campaign}/creators/{name}/warmup/start

Start account warmup for a creator. Sets status to `account_warmup`, records the physical device number and start date.

**Body:**
```json
{"device": 3}
```

| Field | Required | Description |
|---|---|---|
| `device` | Yes | Physical device number (1-14) the account is being warmed up on |

**Response:**
```json
{"message": "Started account warmup for 'bianca-b' on device 3"}
```

---

### POST /api/{campaign}/creators/{name}/warmup/promote

Promote a creator from `account_warmup` to `posting_warmup`. Records the account warmup completion date and posting warmup start date.

**Body (optional):**
```json
{"device": 5}
```

If `device` is provided, the creator's `warmup_device` is updated (for when a creator moves to a different physical device).

**Response:**
```json
{"message": "Promoted 'bianca-b' to posting warmup (moved to device 5)"}
```

---

### POST /api/{campaign}/creators/{name}/warmup/post

Record a warmup post. After 10 posts, the creator is automatically promoted to `active`.

**Body (optional):**
```json
{"date": "2026-03-25"}
```

If no date is provided, defaults to today.

**Response:**
```json
{
  "message": "Recorded warmup post for 'bianca-b'",
  "promoted": false,
  "progress": {
    "status": "posting_warmup",
    "account_warmup": {"started_at": "2026-03-15", "completed_at": "2026-03-23"},
    "posting_warmup": {
      "started_at": "2026-03-23",
      "completed_at": null,
      "target_posts": 10,
      "posts_completed": 3,
      "posts": ["2026-03-23", "2026-03-24", "2026-03-25"]
    }
  }
}
```

When `promoted` is `true`, the creator's status has been set to `active` and `posting_warmup.completed_at` will be populated.

---

### GET /api/{campaign}/creators/{name}/warmup

Get warmup progress for a creator.

**Response:**
```json
{
  "creator": "bianca-b",
  "campaign": "unlove",
  "status": "posting_warmup",
  "warmup_device": 3,
  "account_warmup": {"started_at": "2026-03-15", "completed_at": "2026-03-23"},
  "posting_warmup": {
    "started_at": "2026-03-23",
    "completed_at": null,
    "target_posts": 10,
    "posts_completed": 3,
    "posts": ["2026-03-23", "2026-03-24", "2026-03-25"]
  }
}
```

---

## Warmup Posting

### GET /api/{campaign}/warmup-posting

List warmup posting folders for a date. Returns all scheduled warmup posts with per-platform status, device info, and posting times.

**Query params:**
- `date` (optional): `YYYY-MM-DD`, defaults to today (AEST)

**Response:**
```json
{
  "date": "2026-03-26",
  "posts": [
    {
      "creator": "bianca-b",
      "device_id": "iphone7_1",
      "media_id": 5,
      "media_format": "ugc-video",
      "region": "AEST",
      "folder": "post_1_11:00AM AEST",
      "all_posted": false,
      "platforms": [
        {
          "platform": "instagram",
          "account_id": "40476",
          "scheduled_at": "2026-03-26T11:00:00+11:00",
          "posted": false,
          "failed": false,
          "error": null
        },
        {
          "platform": "tiktok",
          "account_id": "40479",
          "scheduled_at": "2026-03-26T13:15:00+11:00",
          "posted": true,
          "failed": false,
          "error": null
        }
      ]
    },
    {
      "creator": "bianca-b",
      "device_id": "iphone7_1",
      "media_id": 6,
      "media_format": "ugc-video",
      "region": "AEST",
      "folder": "post_2_08:30PM AEST",
      "all_posted": false,
      "platforms": [
        {
          "platform": "instagram",
          "account_id": "40476",
          "scheduled_at": "2026-03-26T20:30:00+11:00",
          "posted": false,
          "failed": false,
          "error": null
        }
      ]
    }
  ]
}
```

Posts are sorted by date → device → creator → post folder. Use `folder` and `platform` values when calling `mark-posted` to target specific posts.

---

### POST /api/{campaign}/warmup-posting/mark-posted

Mark warmup posts as manually posted after posting from your phone. Supports per-platform granularity — you can mark one platform at a time or all at once.

Warmup progress is only recorded when ALL platforms on a post are marked as posted. After reaching `target_posts` (default 10), the creator is automatically promoted to `active`.

**Body:**

| Field | Required | Description |
|---|---|---|
| `creator` | Yes | Creator name |
| `date` | No | Date `YYYY-MM-DD` (default: today AEST) |
| `folder` | No | Specific post folder name (e.g. `"post_1_11:00AM AEST"`) |
| `platform` | No | Specific platform (e.g. `"instagram"`) |

**Examples:**

Mark one platform on one post:
```json
{"creator": "bianca-b", "folder": "post_1_11:00AM AEST", "platform": "instagram"}
```

Mark all platforms on one post:
```json
{"creator": "bianca-b", "folder": "post_1_11:00AM AEST"}
```

Mark everything for a date:
```json
{"creator": "bianca-b", "date": "2026-03-26"}
```

Mark everything for today:
```json
{"creator": "bianca-b"}
```

**Response:**
```json
{
  "message": "Marked 1 post(s) for bianca-b",
  "results": [
    {
      "creator": "bianca-b",
      "media_id": 5,
      "folder": "post_1_11:00AM AEST",
      "platforms_marked": ["instagram"],
      "all_posted": false,
      "promoted": false
    }
  ],
  "progress": {
    "status": "posting_warmup",
    "warmup_device": 0,
    "account_warmup": {"started_at": "2026-03-15", "completed_at": "2026-03-23"},
    "posting_warmup": {
      "started_at": "2026-03-23",
      "completed_at": null,
      "target_posts": 10,
      "posts_completed": 3,
      "posts": ["2026-03-23", "2026-03-24", "2026-03-25"]
    }
  }
}
```

When `all_posted` is `true`, the post folder is deleted and warmup progress incremented. When `promoted` is `true`, the creator has reached their target and been set to `active`.

**Response (not found):**
```json
{"error": "No unposted warmup posts found for bianca-b folder 'post_1_11:00AM AEST' on 2026-03-26"}
```

---

## History

### GET /api/{campaign}/history

Recent daily cycle history summaries.

**Query params:**
- `days` (optional): number of recent days, default `7`
- `date` (optional): specific date `YYYY-MM-DD` for full detail

**Response (summary list):**
```json
{
  "campaign": "unlove",
  "history": [
    {
      "date": "2026-03-18",
      "summary": {
        "total": 30,
        "posted": 22,
        "failed": 1,
        "resting": 7,
        "by_group": {
          "default": {"total": 23, "posted": 22, "failed": 1},
          "rest": {"total": 7, "posted": 0, "failed": 0}
        }
      },
      "plan_snapshot": {
        "groups": [{"name": "default", "content_types": ["meme"]}]
      }
    }
  ]
}
```

**Response (single date detail — `?date=2026-03-18`):**
```json
{
  "date": "2026-03-18",
  "campaign": "unlove",
  "plan_snapshot": {
    "groups": [{"name": "default", "content_types": ["meme"]}]
  },
  "assignments": {
    "abby-m": {"group": "default", "content_types": ["meme"], "region": "AEST", "action": "post", "status": "posted", "scheduled": 2},
    "brooke-p": {"group": "default", "content_types": ["meme"], "region": "AEST", "action": "post", "status": "failed", "error": "generation failed"},
    "chloe-b": {"group": "rest", "content_types": [], "region": "AEST", "action": "rest", "status": "rest"}
  },
  "summary": {
    "total": 30,
    "posted": 22,
    "failed": 1,
    "resting": 7,
    "by_group": {
      "default": {"total": 23, "posted": 22, "failed": 1}
    }
  }
}
```

---

## Content Levels

### GET /api/{campaign}/content-levels

Check text pack content levels across all creators.

**Query params:**
- `threshold` (optional): override the campaign's `content_low_threshold` (default: `posts_per_day * 4`)

**Response:**
```json
{
  "campaign": "unlove",
  "threshold": 8,
  "exhausted": [
    {"creator": "jess-w", "text_pack": "campaigns/unlove/assets/text/pack-3", "text_type": "demo-reframe-check-social-media", "remaining": 0}
  ],
  "low": [
    {"creator": "chloe-b", "text_pack": "campaigns/unlove/assets/text/pack-1", "text_type": "demo", "remaining": 3},
    {"creator": "emma-h", "text_pack": "campaigns/unlove/assets/text/pack-2", "text_type": "meme", "remaining": 7}
  ],
  "total_issues": 3
}
```

---

## Failures

### GET /api/{campaign}/failures

List open (unacknowledged) post failures. Failures are detected by the orchestrator's hourly check and deduplicated — each failure appears only once.

**Response:**
```json
{
  "campaign": "unlove",
  "failures": [
    {
      "post_bridge_id": "pb_abc123",
      "platform": "tiktok",
      "creator": "alice-c",
      "media_id": "5",
      "error": "File access error: content no longer available",
      "error_category": "content_rejected",
      "scheduled_at": "2026-03-18T14:00:00+00:00",
      "detected_at": "2026-03-18T15:00:05",
      "status": "open"
    }
  ],
  "count": 1
}
```

---

### POST /api/{campaign}/failures/{failure_key}/acknowledge

Acknowledge (dismiss) a single failure. The `failure_key` is `{post_bridge_id}:{platform}` (e.g., `pb_abc123:tiktok`). Acknowledged failures will not re-appear.

**Response (success):**
```json
{"message": "Acknowledged 'pb_abc123:tiktok'"}
```

**Response (not found):**
```json
{"error": "Failure 'pb_abc123:tiktok' not found in open failures"}
```

---

### POST /api/{campaign}/failures/acknowledge-all

Acknowledge all open failures at once.

**Response:**
```json
{"message": "Acknowledged 3 failures", "count": 3}
```

---

## Orchestrator Status

### GET /api/orchestrator/status

Orchestrator daemon state. Useful for monitoring whether the daemon is alive and healthy.

**Response:**
```json
{
  "last_main_run": "2026-03-18T20:00:05",
  "last_main_run_minutes_ago": 15,
  "last_deep_run": "2026-03-18T18:00:02",
  "last_deep_run_minutes_ago": 135,
  "total_runs": 47,
  "last_errors": [
    "[unlove] 2 failed posts detected"
  ],
  "creator_status": {
    "unlove/abby-m": {
      "last_deep_check": "2026-03-18T18:00:02",
      "status": "healthy",
      "max_posts_possible": 24,
      "days_available": 12
    },
    "unlove/brooke-p": {
      "last_deep_check": "2026-03-18T18:00:02",
      "status": "warning",
      "max_posts_possible": 6,
      "days_available": 3
    }
  }
}
```

If `last_main_run_minutes_ago` exceeds 120, the orchestrator is likely down.

---

## Error Responses

All errors follow the same format:

```json
{"error": "Description of what went wrong"}
```

| Status | Meaning |
|---|---|
| 400 | Bad request (missing/invalid params) |
| 401 | Unauthorized (missing/invalid API key) |
| 404 | Campaign, creator, or resource not found |
| 500 | Server error |
