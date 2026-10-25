# A4MP RAG Systems — Login Starter

A responsive neon / aurora login and registration starter inspired by the supplied reference image.

## Included
- Email/password registration and login
- Password hashing with bcrypt
- SQLite user database
- Server-side session cookie
- Sign out and session restore
- Responsive glassmorphism UI
- User-provided reference image used as the background
- Google/GitHub buttons clearly marked as placeholders (OAuth requires provider credentials and callback implementation)

## Run locally
Requires Node.js 18+.

```bash
npm install
```

Copy `.env.example` to `.env`, then set a long random `SESSION_SECRET`.

```bash
npm start
```

Open http://localhost:3000.

## Important deployment notes
- This is a Node.js backend app. **It will not run as a complete login system on static GitHub Pages alone**, because GitHub Pages does not run Express/Node server code.
- Deploy the Node server to a Node-capable host and configure its environment variables. Use HTTPS in production.
- The included SQLite database is local-file storage; use persistent disk or a managed database for deployment.
- The Google and GitHub buttons are UI placeholders, not real OAuth. Configure OAuth apps, secrets, callback URLs, and provider routes before claiming social sign-in works.
- Password reset/email verification, rate limiting, CSRF protections, and production monitoring should be added before public production use.
- Change the development session secret and set `NODE_ENV=production` for production.
- Do not commit `.env`, session secrets, OAuth secrets, or database files to GitHub.

## Project files
- `server.js` — Express API and authentication routes
- `public/index.html` — login/register/dashboard UI
- `public/styles.css` — visual design
- `public/app.js` — frontend interactions
- `public/a4mp-background.png` — uploaded reference image
