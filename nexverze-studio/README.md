# NexVerze Studio — Next.js 14 App Router

AI Video Studio project for NexVerze Technologies.

## Target Deployment
- **Vercel Project**: `nexverze-studio` (serving at `nexverze-studio.vercel.app`)
- **Main Domain Route**: `www.nexverze.com/studio` (already rewritten in main `vercel.json`)
- **GitHub Repository**: `github.com/Anand4tech/nexverze-studio`

## Architectural Rules
1. **Design System**: Matches main site with Dark bg `#0a0a12`, Card `#18181b`, Border `#27272a`, Purple `#8b5cf6`, Inter & JetBrains Mono fonts.
2. **Quality LOCK**: All generations produce 1080x1920 master video sources; CSS `object-cover object-center` provides lossless client-side aspect ratio cropping (9:16, 16:9, 1:1) without lossy re-encoding.
3. **Credit System (Supabase)**:
   - Initial user grant: 50 credits
   - Luma Dream Machine: 49 credits (1 free video for new user)
   - Kling AI 1.5 HD: 85 credits
   - Google Veo 3 Pro: 120 credits
   - Insufficient credits popup with Razorpay checkout link
   - Supabase tables: `studio_users` and `studio_generations`
4. **PWA Ready**: `manifest.ts` and icons configured.

## Quick Push to GitHub
```bash
git init
git add .
git commit -m "feat: complete NexVerze Studio Next.js 14 App Router"
git branch -M main
git remote add origin https://github.com/Anand4tech/nexverze-studio.git
git push -u origin main --force
```
