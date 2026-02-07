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

## Cloudflare Worker SMTP Integration

The landing page has two form handlers with placeholder API endpoints:

- **Contact form** → `POST /api/contact`
- **Newsletter** → `POST /api/subscribe`

### Payload formats:

**Contact form sends:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@company.com",
  "company": "Company name",
  "message": "...",
  "type": "contact"
}
```

**Newsletter sends:**
```json
{
  "email": "user@example.com",
  "type": "newsletter"
}
```

### To connect your Cloudflare Worker:

1. In `index.html`, find these two lines and update with your Worker URL:
   ```javascript
   const CONTACT_API_ENDPOINT = '/api/contact';
   const NEWSLETTER_API_ENDPOINT = '/api/subscribe';
   ```

2. Uncomment the `fetch()` calls in `handleContactSubmit()` and `handleNewsletterSubmit()` functions

3. If your Worker is on a different domain, update the URLs to the full Worker URL (e.g., `https://smtp-worker.your-account.workers.dev/contact`)

4. If using Pages Functions instead, create:
   - `functions/api/contact.js`
   - `functions/api/subscribe.js`
   
   This routes requests automatically via Cloudflare Pages Functions.

## Login Button
All login/signup buttons point to: **https://app.cisoai.au**
