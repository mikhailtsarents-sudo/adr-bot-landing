# Platform Links Checklist

## Current Situation

- The website already includes:
  - `/impressum`
  - `/datenschutz`
  - `/legal`
- A compact pilot/test-phase notice is shown in the footer on the homepage.
- I do **not** currently have direct authenticated access to your YouTube or TikTok accounts from this workspace, so those profile changes must be done manually by you.

## Recommended Public Positioning

Use this German short text for profile/bio areas:

```text
Kostenloses Pilotprojekt in Testphase zur ADR-Prüfungsvorbereitung auf Deutsch. Inhalte dienen der Orientierung und Unterstützung beim Selbstlernen.
```

Use this English version only if needed:

```text
Free pilot project in test phase for ADR exam preparation in German. Content is intended for orientation and self-study support.
```

## Recommended Links

- Main website: `https://YOUR-DOMAIN.de/`
- Legal hub: `https://YOUR-DOMAIN.de/legal`
- Impressum: `https://YOUR-DOMAIN.de/impressum`
- Datenschutz: `https://YOUR-DOMAIN.de/datenschutz`

## YouTube: What To Add

### Recommended profile links order

1. Main website
2. Impressum
3. Datenschutz

### Suggested channel description snippet

```text
Kostenloses Pilotprojekt in Testphase zur ADR-Prüfungsvorbereitung auf Deutsch. Inhalte dienen der Orientierung und Unterstützung beim Selbstlernen.
```

### Click path

1. Open YouTube Studio.
2. Go to `Customization`.
3. Open the `Profile` tab.
4. In `Description`, add the short pilot-project text if desired.
5. In `Links`, add:
   - website
   - Impressum
   - Datenschutz
6. Save changes.

## TikTok: What To Add

### If `Website` field is available

- Add: `https://YOUR-DOMAIN.de/legal`

Reason:
- TikTok usually gives only one practical website link.
- `/legal` is the safest single link because it leads to both legal pages in one place.

### Suggested bio text

```text
Kostenloses Pilotprojekt in Testphase zur ADR-Prüfungsvorbereitung auf Deutsch.
```

### Click path

1. Open TikTok profile.
2. Tap `Edit profile`.
3. If `Website` is available, insert `/legal`.
4. Add the short bio text.
5. Save.

### If `Website` field is not available

Do this:

1. Check whether the account can switch to a `Business Account`.
2. If available, switch and re-check `Edit profile`.
3. If website still is not available, connect YouTube in profile settings.
4. Put the website/legal links on YouTube first and route people there.

## Before Going Public

Replace the placeholders in:

- `src/lib/legal.ts`

Specifically:

- business/operator name
- full address
- email
- responsible person
- optional phone
- hosting provider details in Datenschutzerklärung if final host is known
