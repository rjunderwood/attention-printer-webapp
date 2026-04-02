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
  "creator_types": ["ugc_video", "ugc_mixed", "ugc_slideshow", "faceless_video", "faceless_slideshow"],
  "posts_per_day": 2,
  "rest_pattern": [true, true, false],
  "content_low_threshold": 8,
  "daily_cycle": {
    "enabled": true,
    "notification_hour": 19,
    "notification_minute": 0,
    "confirmation_window_minutes": 60
  },
  "warmup": {
    "account_warmup_days": 12,
    "posting_warmup_target_posts": 10
  }
}
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
    {"name": "abby-m", "region": "AEST", "type": "ugc_video", "status": "active", "plan_group": "group-a", "plan_action": "post", "profile_picture_url": "http://127.0.0.1:5000/api/unlove/creators/abby-m/profile-picture"},
    {"name": "bianca-b", "region": "AEST", "type": "ugc_video", "status": "posting_warmup", "warmup_device": 3, "warmup": {"account_warmup": {"started_at": "2026-03-15", "completed_at": "2026-03-23"}, "posting_warmup": {"started_at": "2026-03-23", "completed_at": null, "target_posts": 10, "posts_completed": 3}}, "profile_picture_url": "http://127.0.0.1:5000/api/unlove/creators/bianca-b/profile-picture"},
    {"name": "vanessa-a", "region": "AEST", "type": "ugc_video", "status": "paused", "inactive_reason": "Text exhausted: meme", "profile_picture_url": "http://127.0.0.1:5000/api/unlove/creators/vanessa-a/profile-picture"}
  ]
}
```

The `warmup_device` field is only present for creators that have a device assigned (those in `account_warmup` or `posting_warmup` status).

The `warmup` field is only present for creators in `account_warmup` or `posting_warmup` status. It contains:
- `account_warmup.started_at` / `completed_at` — when account warmup began and ended
- `posting_warmup.started_at` / `completed_at` — when posting warmup began and ended
- `posting_warmup.target_posts` — number of posts required before promotion to active (from campaign config)
- `posting_warmup.posts_completed` — number of warmup posts recorded so far

For the full list of individual post dates, use `GET /api/{campaign}/creators/{name}/warmup`.

The `status` field indicates the creator's current state. Possible values:
- `"active"` — fully active, posting normally
- `"posting_warmup"` — active but in posting warmup phase
- `"paused"` — temporarily paused from posting
- `"account_warmup"` — new account being warmed up
- `"pending"` — newly created, not yet set up
- `"archived"` — permanently retired

The `plan_group` and `plan_action` fields are only present when there is an active plan template running. They indicate the creator's assignment in today's plan:
- `plan_group` — the group name the creator is assigned to (e.g. `"group-a"`), `"rest"` if resting, or `"unassigned"` if not matched by any group
- `plan_action` — one of `"post"` (posting today), `"rest"` (rest day), or `"skip"` (unassigned)

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

### POST /api/{campaign}/creators/{name}/type

Change a creator's type.

**Body:**
```json
{"type": "faceless_slideshow"}
```

| Field | Required | Description |
|---|---|---|
| `type` | Yes | One of: `"ugc_video"`, `"ugc_mixed"`, `"ugc_slideshow"`, `"faceless_video"`, `"faceless_slideshow"` |

**Response:**
```json
{"message": "Set 'abby-m' type to 'faceless_slideshow'"}
```

**Response (invalid type):**
```json
{"error": "Invalid type 'bad'. Must be one of: ugc_video, ugc_mixed, ugc_slideshow, faceless_video, faceless_slideshow"}
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
    "abby-m": {"group": "default", "content_types": ["meme"], "region": "AEST", "type": "ugc_video", "action": "post", "status": "posted", "scheduled": 2},
    "brooke-p": {"group": "default", "content_types": ["meme"], "region": "AEST", "type": "ugc_video", "action": "post", "status": "failed", "error": "generation failed"},
    "chloe-b": {"group": "rest", "content_types": [], "region": "AEST", "type": "ugc_video", "action": "rest", "status": "rest"}
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

## Forecast

### GET /api/{campaign}/forecast

Queue-based content pipeline forecast for all creators. Returns queue levels, scheduling status, and health assessment for every creator in the active plan.

**Response:**
```json
{
  "campaign": "unlove",
  "summary": {
    "total_creators": 12,
    "status_breakdown": {"healthy": 8, "warning": 2, "critical": 2},
    "creators_by_status": {
      "healthy": ["alice", "bianca", "..."],
      "warning": ["chloe-b", "emma-h"],
      "critical": ["jess-w", "kate-m"]
    },
    "urgent_actions": [
      "jess-w: Generate queue content for all assigned types",
      "kate-m: Generate queue content for: ugc_video/stuck-in-your-head"
    ]
  },
  "creators": {
    "jess-w": {
      "creator": "jess-w",
      "campaign": "unlove",
      "timestamp": "2026-04-03T07:00:00.000000",
      "scope": "active",
      "group": "everyone",
      "action": "post",
      "region": "EST",
      "status": "critical",
      "warnings": ["All queues exhausted: ugc_slideshow/day-1-no-contact"],
      "action_items": ["Generate queue content for all assigned types"],
      "queue_levels": {"ugc_slideshow/day-1-no-contact": 0},
      "total_available": 0,
      "scheduling": {
        "platforms": ["instagram", "tiktok"],
        "scheduled_posts_total": 4,
        "days_available_full": 1,
        "status_breakdown": {
          "instagram": {"scheduled": 2, "posted": 0, "failed": 0, "manual": 0},
          "tiktok": {"scheduled": 2, "posted": 0, "failed": 0, "manual": 0}
        }
      }
    }
  }
}
```

---

### GET /api/{campaign}/forecast/{creator_name}

Detailed queue-based forecast for a single creator.

**Response:**
```json
{
  "creator": "jess-w",
  "campaign": "unlove",
  "timestamp": "2026-04-03T07:00:00.000000",
  "scope": "active",
  "group": "everyone",
  "action": "post",
  "region": "EST",
  "status": "critical",
  "warnings": ["All queues exhausted: ugc_slideshow/day-1-no-contact"],
  "action_items": ["Generate queue content for all assigned types"],
  "queue_levels": {"ugc_slideshow/day-1-no-contact": 0},
  "total_available": 0,
  "scheduling": {
    "platforms": ["instagram", "tiktok"],
    "scheduled_posts_total": 4,
    "days_available_full": 1,
    "status_breakdown": {
      "instagram": {"scheduled": 2, "posted": 0, "failed": 0, "manual": 0},
      "tiktok": {"scheduled": 2, "posted": 0, "failed": 0, "manual": 0}
    }
  }
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

## Templates

### GET /api/{campaign}/templates

List all content templates across all categories.

**Query params:**
- `status` (optional): Filter by status (e.g. `pending`, `active`)
- `category` (optional): Filter by category (`faceless_slideshow`, `ugc_slideshow`, `ugc_video`)

**Response:**
```json
{
  "campaign": "unlove",
  "templates": [
    {
      "name": "i-promise-i-wont-call",
      "category": "faceless_slideshow",
      "status": "pending",
      "slide_count": 10
    },
    {
      "name": "7-signs-shes-not-coming-back",
      "category": "ugc_slideshow",
      "status": "pending",
      "slide_count": 9
    },
    {
      "name": "he-came-back",
      "category": "ugc_video",
      "status": "pending",
      "reaction_duration": 4,
      "clip": "none"
    }
  ]
}
```

Slideshow templates include `slide_count`. UGC video templates include `reaction_duration` and `clip` type. Templates without a `config.json` or `status` field are treated as `"active"`.

---

### GET /api/{campaign}/templates/{category}/{template_name}

Full template detail including slides, config, writing guide, and validation status.

**Response (slideshow types):**
```json
{
  "campaign": "unlove",
  "name": "i-promise-i-wont-call",
  "category": "faceless_slideshow",
  "status": "pending",
  "caption": "",
  "writing_guide": "# Writing Guide: i-promise-i-wont-call\n...",
  "validation": {"ready": false, "missing": ["slide_10/image/fixed_image.png"]},
  "slides": [
    {
      "slide_number": 1,
      "image": {
        "type": "generated_prompt",
        "prompt": "{\"basic\": \"...\", \"json\": {...}}",
        "has_reference_image": true,
        "has_fixed_image": false,
        "reference_image_url": "http://127.0.0.1:5000/api/unlove/templates/faceless_slideshow/i-promise-i-wont-call/slides/1/reference-image",
        "fixed_image_url": null
      },
      "text": {
        "position": "center",
        "text": "i woke up crying{lg}\ni miss you{lg}"
      }
    }
  ]
}
```

**Response (ugc_video):**
```json
{
  "campaign": "unlove",
  "name": "he-came-back",
  "category": "ugc_video",
  "status": "pending",
  "config": {
    "reaction_duration": 4,
    "clip": "fixed",
    "text": {"position": "center", "duration": "all"}
  },
  "text": "",
  "caption": "",
  "writing_guide": "# Writing Guide: he-came-back\n...",
  "has_thumbnail": true,
  "thumbnail_url": "http://127.0.0.1:5000/api/unlove/templates/ugc_video/he-came-back/thumbnail",
  "clips": [
    {"filename": "fixed_en.mp4", "url": "http://127.0.0.1:5000/api/unlove/templates/ugc_video/he-came-back/clip/fixed_en.mp4"}
  ],
  "clip_requirements": {
    "type": "fixed",
    "required_languages": ["de", "en"],
    "status": [
      {"filename": "fixed_de.mp4", "present": false},
      {"filename": "fixed_en.mp4", "present": true}
    ]
  },
  "validation": {"ready": false, "missing": ["clip/fixed_de.mp4"]}
}
```

For `clip: "creator"`, `clip_requirements` lists `required_creators` instead of `required_languages`, with one `{creator_name}.mp4` per active ugc_video creator. For `clip: "none"`, `clip_requirements` is `{"type": "none"}`.

---

### GET /api/{campaign}/templates/{category}/{template_name}/slides/{slide_num}/reference-image

Serve a slide's research reference image as JPEG. **Auth-exempt** — can be used in `<img>` tags.

**Response:** `image/jpeg` binary data (200), or 404 if not found.

---

### GET /api/{campaign}/templates/{category}/{template_name}/slides/{slide_num}/fixed-image

Serve a slide's fixed image as PNG. **Auth-exempt** — can be used in `<img>` tags.

**Response:** `image/png` binary data (200), or 404 if not found.

---

### GET /api/{campaign}/templates/ugc_video/{template_name}/thumbnail

Serve a ugc_video template's reference thumbnail as JPEG. **Auth-exempt** — can be used in `<img>` tags.

**Response:** `image/jpeg` binary data (200), or 404 if not found.

---

### GET /api/{campaign}/templates/ugc_video/{template_name}/clip/{filename}

Serve a ugc_video template clip as MP4. **Auth-exempt** — can be used in `<video>` tags.

**Response:** `video/mp4` binary data (200), or 404 if not found.

---

### POST /api/{campaign}/templates/{category}/{template_name}/slides/{slide_num}/fixed-image

Upload a fixed image for a slide. Only applicable to `faceless_slideshow` and `ugc_slideshow` templates, and only for slides where `image/config.json` has `"type": "fixed"`.

**Content-Type:** `multipart/form-data`

| Field | Required | Description |
|---|---|---|
| `file` | Yes | The image file (saved as `fixed_image.png`) |

**Response:**
```json
{
  "message": "Uploaded fixed image for slide 10",
  "slide": 10,
  "template": "i-promise-i-wont-call"
}
```

**Response (wrong slide type):**
```json
{"error": "Slide 3 is type 'generated_prompt', not 'fixed'"}
```

---

### POST /api/{campaign}/templates/ugc_video/{template_name}/clip

Upload a clip for a ugc_video template. Only applicable when clip type is `"fixed"` or `"creator"`.

**Content-Type:** `multipart/form-data`

| Field | Required | Description |
|---|---|---|
| `file` | Yes | The `.mp4` video file |
| `filename` | Yes | Target filename — must follow naming convention (see below) |

**Filename conventions:**
- For `clip: "fixed"`: `fixed_{lang}.mp4` (e.g. `fixed_en.mp4`, `fixed_de.mp4`). One per language used by active ugc_video creators.
- For `clip: "creator"`: `{creator_name}.mp4` (e.g. `alice.mp4`, `briana-c.mp4`). Must match an existing creator name.

**Response:**
```json
{
  "message": "Uploaded clip 'fixed_en.mp4'",
  "filename": "fixed_en.mp4",
  "template": "he-came-back"
}
```

**Response (invalid filename):**
```json
{"error": "For clip type 'fixed', filename must match 'fixed_{lang}.mp4' (e.g. fixed_en.mp4). Got: bad_name.mp4"}
```

**Response (clip type none):**
```json
{"error": "This template has clip type 'none' — no clips needed"}
```

---

### POST /api/{campaign}/templates/{category}/{template_name}/config

Partial update of template config. Merges provided fields into the existing `config.json`. Cannot set status to `"active"` — use the `/activate` endpoint instead.

**Body (ugc_video example):**
```json
{
  "reaction_duration": 5,
  "clip": "fixed",
  "text": {"position": "top", "duration": 3.5}
}
```

The `text` field is deep-merged: you can update `position` without losing `duration`.

**Response:**
```json
{
  "message": "Updated config for 'he-came-back'",
  "config": {
    "status": "pending",
    "reaction_duration": 5,
    "clip": "fixed",
    "text": {"position": "top", "duration": 3.5}
  }
}
```

**Response (trying to activate):**
```json
{"error": "Cannot set status to 'active' via config update. Use the /activate endpoint."}
```

---

### POST /api/{campaign}/templates/{category}/{template_name}/activate

Activate a pending template. Validates all required assets are present before allowing activation.

**Validation rules:**
- **faceless_slideshow / ugc_slideshow:** Every slide with `"type": "fixed"` must have `fixed_image.png` present.
- **ugc_video with `clip: "fixed"`:** Must have `fixed_{lang}.mp4` for every language used by active ugc_video creators (e.g. `en`, `de`).
- **ugc_video with `clip: "creator"`:** Must have `{creator_name}.mp4` for every active ugc_video creator.
- **ugc_video with `clip: "none"`:** No clip validation required.

**Response (success):**
```json
{
  "message": "Activated template 'i-promise-i-wont-call'",
  "status": "active"
}
```

**Response (missing assets):**
```json
{
  "error": "Cannot activate: missing required assets",
  "missing": ["slide_10/image/fixed_image.png"]
}
```

**Response (already active):**
```json
{"error": "Template 'i-promise-i-wont-call' is already active"}
```

---

## Queues

### GET /api/{campaign}/queues/scan

Scan all queues for creators with low generation counts. Use this to detect when `/generate-queue-content` needs to be run.

**Query params:**
- `minimum` (optional): Minimum unused generations required (default: `2`)

**Response (all good):**
```json
{
  "campaign": "unlove",
  "minimum": 2,
  "shortfalls": [],
  "count": 0,
  "ok": true
}
```

**Response (shortfalls found):**
```json
{
  "campaign": "unlove",
  "minimum": 2,
  "shortfalls": [
    {
      "campaign": "unlove",
      "category": "faceless_slideshow",
      "content_type": "i-promise-i-wont-call",
      "creator": "alice",
      "available": 0,
      "needed": 2
    },
    {
      "campaign": "unlove",
      "category": "ugc_video",
      "content_type": "he-came-back",
      "creator": "alice",
      "available": 1,
      "needed": 1
    }
  ],
  "count": 2,
  "ok": false
}
```

When `ok` is `false`, run the `/generate-queue-content` Claude command to top up.

---

### POST /api/{campaign}/queues/{category}/add-creator

Add an empty creator folder to all content type queues within a category. Skips any content type where the creator already exists.

**Body:**
```json
{"creator": "alice"}
```

| Field | Required | Description |
|---|---|---|
| `creator` | Yes | Creator name to add to all queues in the category |

**Response:**
```json
{
  "creator": "alice",
  "category": "faceless_slideshow",
  "content_types": {
    "i-promise-i-wont-call": "created",
    "who-suffers-more-no-contact": "already_exists"
  }
}
```

Each content type reports `"created"` or `"already_exists"`.

**Response (invalid category):**
```json
{"error": "Invalid category 'bad'. Must be one of: faceless_slideshow, ugc_slideshow, ugc_video"}
```

**Response (no queues):**
```json
{"error": "No content types found in faceless_slideshow/queues/"}
```

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

---

## Plan System

Multi-day plan templates with independent active and warmup scopes. All endpoints accept a `scope` parameter (`active` or `warmup`, default: `active`).

- **Active scope**: Targets `status=active` creators. Templates loop. Campaign rest pattern applies (unless `auto_rest=false`).
- **Warmup scope**: Targets `status=posting_warmup` creators. Uses cohorts. Templates run once (no loop). Creators graduate to active on completion.

Content is specified as `[{content_category, content_type}]` mapping to `campaigns/{campaign}/content/type/{category}/templates/{type}`.

---

### GET /api/{campaign}/plan/templates

List plan templates.

**Query params:** `scope=active` (default) or `scope=warmup`

**Response:**
```json
{
  "campaign": "unlove",
  "scope": "active",
  "templates": [
    {
      "id": "tmpl_a1b2c3d4",
      "name": "3-day rotation",
      "cycle_days": 3,
      "active": true,
      "created_at": "2026-03-29T10:00:00",
      "updated_at": "2026-03-29T12:00:00"
    }
  ]
}
```

---

### POST /api/{campaign}/plan/templates

Create a new template.

**Body:**
```json
{
  "scope": "active",
  "name": "3-day rotation",
  "cycle_days": 3,
  "auto_rest": true
}
```

| Field | Required | Description |
|---|---|---|
| scope | No | `active` (default) or `warmup` |
| name | Yes | Template name |
| cycle_days | Yes | Number of days in the cycle (positive integer) |
| auto_rest | No | Enable campaign rest pattern (default: true). Set false when using forced rest groups. |

**Response:**
```json
{
  "message": "Created template '3-day rotation'",
  "template": { "id": "tmpl_a1b2c3d4", "name": "3-day rotation", "cycle_days": 3, "auto_rest": true, "days": {"1": {"groups": []}, "2": {"groups": []}, "3": {"groups": []}}, ... }
}
```

---

### GET /api/{campaign}/plan/templates/{id}

Get full template detail.

**Query params:** `scope=active`

**Response:**
```json
{
  "campaign": "unlove",
  "scope": "active",
  "template": {
    "id": "tmpl_a1b2c3d4",
    "name": "3-day rotation",
    "cycle_days": 3,
    "auto_rest": true,
    "days": {
      "1": {
        "groups": [
          {
            "name": "est-ugc",
            "content": [{"content_category": "ugc_video", "content_type": "example_ugc_video_1"}],
            "region": "EST"
          }
        ]
      }
    }
  }
}
```

---

### DELETE /api/{campaign}/plan/templates/{id}

Delete a template. Fails if active in either scope.

**Query params:** `scope=active`

---

### POST /api/{campaign}/plan/templates/{id}/set-day

Set a group on a specific day.

**Body:**
```json
{
  "scope": "active",
  "day": 1,
  "group": {
    "name": "est-ugc",
    "content": [
      {"content_category": "ugc_video", "content_type": "example_ugc_video_1"},
      {"content_category": "faceless_slideshow", "content_type": "example_faceless_slideshow_1"}
    ],
    "region": "EST",
    "count": null,
    "creator_type": null,
    "creators": null,
    "rest": false
  }
}
```

| Group field | Description |
|---|---|
| name | Group name (required) |
| content | List of `{content_category, content_type}`. Length = posts per day. Required unless `rest=true`. |
| region | Filter: EST, AEST, CET |
| count | Limit number of creators |
| creator_type | Filter: ugc_video, ugc_mixed, ugc_slideshow, faceless_video, faceless_slideshow |
| creators | Specific creator names (overrides region/type/count) |
| rest | Force rest day for this group (no content needed) |

**Response:** Returns updated template.

---

### POST /api/{campaign}/plan/templates/{id}/remove-group

**Body:** `{"scope": "active", "day": 1, "group_name": "est-ugc"}`

---

### POST /api/{campaign}/plan/templates/{id}/clone

Clone a template with adjustments from an activation period overlaid.

**Body:**
```json
{
  "scope": "active",
  "name": "Cloned template",
  "period": null,
  "cycle": null
}
```

| Field | Description |
|---|---|
| name | Name for new template (required) |
| period | Activation period ID (default: most recent) |
| cycle | Only overlay adjustments from this cycle number |

---

### GET /api/{campaign}/plan/templates/{id}/validate

Check if all content paths in the template exist.

**Query params:** `scope=active`

**Response:**
```json
{
  "campaign": "unlove",
  "template_id": "tmpl_a1b2c3d4",
  "valid": false,
  "errors": ["Day 1, group 'est-ugc': template not found at ugc_video/templates/missing_type"]
}
```

---

### GET /api/{campaign}/plan/show

Show current plan state.

**Query params:** `scope=active`

**Response (active scope):**
```json
{
  "campaign": "unlove",
  "scope": "active",
  "active": true,
  "template_id": "tmpl_a1b2c3d4",
  "template_name": "3-day rotation",
  "cycle_days": 3,
  "auto_rest": true,
  "current_cycle_day": 2,
  "cycle_count": 5,
  "activated_at": "2026-03-20T10:00:00",
  "last_completed_date": "2026-03-28",
  "current_day_groups": [...],
  "confirmation": {
    "target_date": "2026-03-29",
    "status": "pending",
    "adjusted": false,
    "confirmed_at": null,
    "confirmed_by": null
  }
}
```

**Response (warmup scope):**
```json
{
  "campaign": "unlove",
  "scope": "warmup",
  "active": true,
  "template_id": "tmpl_xyz",
  "template_name": "7-day warmup",
  "cycle_days": 7,
  "active_cohorts": [
    {"id": "cohort_abc", "creators": ["alice", "bob"], "current_day": 4, "status": "in_progress", "started_at": "2026-03-24T10:00:00", "completed_at": null}
  ],
  "completed_cohorts": [...]
}
```

Returns `{"active": false}` when no template is active for the scope.

---

### POST /api/{campaign}/plan/activate

Activate a template for a scope.

**Body:** `{"scope": "active", "template_id": "tmpl_a1b2c3d4"}`

---

### POST /api/{campaign}/plan/deactivate

Deactivate the current template.

**Body:** `{"scope": "active"}`

---

### GET /api/{campaign}/plan/preview

Preview assignments for a date.

**Query params:** `scope=active`, `date=2026-03-30` (default: tomorrow)

**Response (active scope):**
```json
{
  "campaign": "unlove",
  "scope": "active",
  "date": "2026-03-30",
  "template_id": "tmpl_a1b2c3d4",
  "cycle_day": 2,
  "cycle_count": 5,
  "total": 51,
  "posting": 33,
  "resting": 5,
  "unassigned": 0,
  "assignments": {
    "alice": {"group": "est-ugc", "content": [...], "region": "AEST", "type": "ugc_video", "action": "post"},
    "bob": {"group": "rest", "content": [], "region": "EST", "type": "ugc_video", "action": "rest"}
  }
}
```

**Response (warmup scope):**
```json
{
  "campaign": "unlove",
  "scope": "warmup",
  "date": "2026-03-30",
  "total": 3,
  "posting": 3,
  "resting": 0,
  "cohorts": {
    "cohort_abc": {"day": 4, "creators": ["alice", "bob"], "started_at": "2026-03-24T10:00:00"},
    "cohort_def": {"day": 1, "creators": ["cass"], "started_at": "2026-03-28T10:00:00"}
  },
  "assignments": {
    "alice": {"group": "all-warmup", "content": [...], "action": "post", "cohort_id": "cohort_abc", "cohort_day": 4}
  }
}
```

---

### POST /api/{campaign}/plan/confirm

Confirm the pending plan.

**Body:**
```json
{"scope": "active", "refresh": false}
```

Set `refresh: true` to re-resolve assignments with the current template before confirming.

---

### POST /api/{campaign}/plan/adjust

Adjust a pending day's group without changing the base template.

**Body:**
```json
{
  "scope": "active",
  "group": "est-ugc",
  "content": [{"content_category": "ugc_video", "content_type": "example_ugc_video_2"}],
  "region": "EST"
}
```

Only works when confirmation status is `pending`. Creates an adjustment record.

---

### GET /api/{campaign}/plan/history

Plan execution history.

**Query params:** `scope=active`, `date=2026-03-29` (specific day) or `days=7` (summary list)

**Response (summary):**
```json
{
  "campaign": "unlove",
  "scope": "active",
  "history": [
    {
      "date": "2026-03-29",
      "template_id": "tmpl_a1b2c3d4",
      "cycle_day": 2,
      "cycle_count": 5,
      "adjusted": false,
      "summary": {"total": 51, "posted": 33, "failed": 0, "resting": 5, "by_group": {...}}
    }
  ]
}
```

**Response (detail with `?date=`):** Returns full history record including all assignments.

---

### GET /api/{campaign}/plan/adjustments

List dates that had plan adjustments.

**Query params:** `scope=active`

**Response:**
```json
{
  "campaign": "unlove",
  "scope": "active",
  "adjustments": [
    {"date": "2026-03-29", "template_id": "tmpl_a1b2c3d4", "cycle_day": 2, "cycle_count": 5, "adjusted_at": "2026-03-29T15:00:00"}
  ]
}
```

---

### GET /api/{campaign}/plan/queue-check

Check queue availability for tomorrow's plan.

**Query params:** `scope=active`

**Response:**
```json
{
  "campaign": "unlove",
  "scope": "active",
  "date": "2026-03-30",
  "total_shortfalls": 3,
  "shortfalls": [
    {"creator": "alice", "content_category": "ugc_video", "content_type": "example_1", "available": 0, "needed": 1}
  ]
}
```

---

### GET /api/{campaign}/plan/template-history

Template activation history — when templates were in use.

**Query params:** `scope=active`

**Response:**
```json
{
  "campaign": "unlove",
  "scope": "active",
  "entries": [
    {
      "id": "act_abc123",
      "template_id": "tmpl_a1b2c3d4",
      "template_name": "3-day rotation",
      "cycle_days": 3,
      "scope": "active",
      "activated_at": "2026-03-20T10:00:00",
      "first_generation_at": "2026-03-20T19:00:00",
      "ended_at": null,
      "status": "active",
      "generation_count": 9,
      "cycles_completed": 3
    }
  ]
}
```

Status values: `pending` (activated, no generation yet), `active` (generating), `ended` (replaced).

---

### GET /api/{campaign}/plan/cohorts

List all warmup cohorts.

**Response:**
```json
{
  "campaign": "unlove",
  "template_id": "tmpl_xyz",
  "template_name": "7-day warmup",
  "cycle_days": 7,
  "cohorts": [
    {"id": "cohort_abc", "creators": ["alice", "bob"], "current_day": 4, "status": "in_progress", "started_at": "2026-03-24T10:00:00", "completed_at": null},
    {"id": "cohort_def", "creators": ["cass"], "current_day": 1, "status": "in_progress", "started_at": "2026-03-28T10:00:00", "completed_at": null}
  ]
}
```

---

### POST /api/{campaign}/plan/cohorts

Add a new warmup cohort.

**Body:**
```json
{"creators": ["alice", "bob", "charlie"]}
```

Validates each creator exists and has `status=posting_warmup`. Invalid creators are skipped with warnings.

**Response:**
```json
{
  "message": "Added cohort with 2 creator(s)",
  "cohort": {"id": "cohort_abc", "creators": ["alice", "bob"], "current_day": 1, "status": "in_progress", ...},
  "warnings": ["'charlie' has status 'active', not 'posting_warmup'"]
}
```

---

### DELETE /api/{campaign}/plan/cohorts/{id}

Remove a warmup cohort.
