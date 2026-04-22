# TikTok Setup Log

This file is a working log for TikTok setup and future automation.

## Account

- Account name: `adr.expert`
- Handle: `adr.expert`
- Profile URL: public profile is visible from other accounts
- Account type: unknown
- TikTok Studio access: yes
- TikTok Developer access: yes
- Business verification: unknown

## Publishing Status

- Existing uploaded video count: 1
- Latest visible issue: one posted video shows 0 views
- First diagnosis:
  - check visibility (public vs private/friends-only)
  - check moderation/review state
  - check copyright/music restrictions
  - check account trust/new-account distribution limits
- Follow-up findings:
  - the posted video is public
  - it is visible from another account
  - privacy settings are not the issue
  - the most likely problem is weak or absent distribution, not failed publishing

## API App

- Developer app created: yes
- App name: `ADR Bot TikTok Publisher`
- Client key: configured
- Client secret: configured
- Redirect URI: `https://www.adr-bot.de/api/tiktok/callback`
- Webhook URL:
- Required scopes: not finalized yet
- Domain verification: completed for `adr-bot.de`
- Added products:
  - `Login Kit`
  - `Content Posting API`
- Direct Post: intentionally left off for now

## Automation Readiness

- Upload API access: partially prepared
- Publish API access: partially prepared
- Analytics API access: unknown
- Refresh token stored: no
- Access token stored: no

## Notes

- Do not commit live secrets to Git.
- If we store secrets here temporarily, move them to a password manager or env store later.
- The TikTok client secret was exposed during setup screenshots and should be rotated before final production use.

## AI Content Distribution Notes

These are working recommendations for future TikTok and Shorts content production.

### Current Diagnosis

- Existing TikTok video is public and visible from another account.
- Privacy is not the issue.
- Most likely problem is weak distribution, not failed publication.
- Main risk factors:
  - brand-new or low-trust account
  - content looks too synthetic or mass-produced
  - content may be interpreted as reused/promotional/low-originality

### What To Improve In AI Videos

- Make videos less obviously synthetic.
- Avoid overly plastic faces and sterile visuals.
- Avoid repeating the same template across many posts.
- Avoid slideshow-like pacing and repetitive motion patterns.
- Add a stronger human layer:
  - more natural voiceover
  - stronger opening hook
  - better caption writing
  - better cover selection
  - more real-world detail and imperfection
- Make the first 1–2 seconds immediately legible and attention-grabbing.
- Keep the pacing native to TikTok, not presentation-like.
- Avoid anything that looks like automated spam or generic ad creative.

### Signals That Can Hurt Distribution

- repeated template structure across many videos
- identical visual rhythm across posts
- too-clean AI look
- obvious stock/AI avatar vibe
- low originality or reused-content feel
- videos that feel like ads rather than native posts
- same music, same openings, same CTA structure on every post

### Practical Strategy Before Full Automation

- Do not rely on mass automated posting at the start.
- First publish several test TikTok videos manually.
- Use those tests to see whether the account receives baseline distribution.
- Improve account trust before scaling automation:
  - complete profile
  - consistent branding
  - a few organic/manual posts
  - some initial engagement if possible
- Only after baseline reach appears, scale the pipeline.

### Content Checklist For Future TikTok/Shorts

- original hook in first seconds
- non-generic title/caption
- less synthetic visuals
- no repetitive template spam
- native vertical pacing
- no watermark issues
- no reused-content look
- honest AI disclosure if platform requires it

## TikTok App Review Blocker

- TikTok review currently requires at least one demo video.
- The demo video must show the real end-to-end integration flow.
- If the app has not been approved before, the demo should use the sandbox environment.
- The video must clearly demonstrate:
  - the real website/app UI
  - the TikTok integration flow
  - every requested product
  - every requested scope
- Conclusion:
  - do not submit the app for review yet
  - first finish the actual TikTok posting integration
  - then record a real demo video and only after that submit for review

## Current Working State

What is already done:

- TikTok app foundation exists
- required domain proof is done
- required base product chain is added (`Login Kit` -> `Content Posting API`)
- callback URL has been chosen

What is not done yet:

- actual auth callback route implementation
- actual upload/posting flow implementation
- token storage / refresh flow
- sandbox end-to-end test
- demo video for review
- final app review submission
