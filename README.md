# CISO AI Landing Page — Cloudflare Pages Deployment

## File Structure
```
cisoai-landing/
├── index.html          ← Main landing page
└── assets/
    └── logo.png        ← CISO AI logo
```

## Deploy to Cloudflare Pages

### Option 1: Direct Upload (Easiest)
1. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create**
2. Select **Pages** → **Upload assets**
3. Name your project (e.g., `cisoai-landing`)
4. Drag and drop the entire `cisoai-landing/` folder
5. Click **Deploy**
6. Set custom domain: Go to **Custom domains** → Add `cisoai.au` (or your domain)

### Option 2: Git Integration
1. Push `cisoai-landing/` to a GitHub/GitLab repo
2. In Cloudflare Pages, connect your repo
3. Build settings: No build command needed, output directory = `/`
4. Deploy

### Option 3: Wrangler CLI
```bash
npm install -g wrangler
wrangler pages deploy cisoai-landing/ --project-name=cisoai-landing
```

## Encoding Notes
- Keep files saved as UTF-8. Avoid re-saving as Windows-1252/ANSI, which corrupts characters like em dashes and box-drawing glyphs.
- If using PowerShell to rewrite files, specify UTF-8 explicitly (for example: `Out-File -Encoding utf8`).

## Email Integration (Cloudflare Access Protected Worker)

The landing page sends emails via a **same-origin proxy** at `/api/send` (Cloudflare Pages Function). The proxy forwards to your Cloudflare email worker with Access service-token headers, so the worker can remain protected by Cloudflare Access.

Default upstream (override with env var if needed):

`https://365soft-email-worker.nick-598.workers.dev/api/send`

### Payload format
```json
{
  "to": "admin@cisoai.au",
  "subject": "New Contact Enquiry",
  "message": "<p>Hello</p>",
  "contentType": "HTML",
  "fromEmail": "hello@cisoai.au"
}
```

### Cloudflare Access (Pages Function proxy)

Configure these **Pages** environment variables (production + preview if needed):

- `CF_ACCESS_CLIENT_ID` (service token client id)
- `CF_ACCESS_CLIENT_SECRET` (service token client secret)
- `EMAIL_API_URL` (optional override; defaults to the 365soft worker URL)

The proxy function lives at `functions/api/send.js`.

## Login Button
All login buttons point to: **/login.html**
All signup buttons point to: **/signup.html**
