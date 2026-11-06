# Meduza

AI video editing studio.

## Live Preview

Import this repo into [Vercel](https://vercel.com/new) for an instant preview URL.

## Local

```bash
npm install
npm run dev
```

Open http://localhost:8080

## Your server (Meduza API)

The site stores nothing secret. API keys, the shared workspace and AI ideas live on your own server.

On the VPS (Hostinger hPanel → VPS → Browser terminal, as root):

```bash
curl -fsSL https://raw.githubusercontent.com/AhmedMasum2000000/meduza/main/server/install.sh | bash
```

It prints a server address and an admin password. Open the site → **Admin** → paste both. Run the same command again to update.
For a permanent address, point a subdomain at the VPS and add `DOMAIN=api.yourdomain.com` before `bash`.
