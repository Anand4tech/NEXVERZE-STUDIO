import pageSource from '../../nexverze-studio/app/page.tsx?raw';
import historySource from '../../nexverze-studio/app/history/page.tsx?raw';

/**
 * Returns complete file tree for nexverze-studio Next.js 14 App Router project
 * Ready for deployment to nexverze-studio.vercel.app and push to github.com/Anand4tech/nexverze-studio
 */
export function getNextJsProjectFiles(): Record<string, string> {
  return {
    'app/page.tsx': pageSource,
    'app/history/page.tsx': historySource,
    'package.json': JSON.stringify(
      {
        name: 'nexverze-studio',
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint',
        },
        dependencies: {
          '@fal-ai/client': '^1.1.0',
          '@supabase/supabase-js': '^2.49.1',
          'lucide-react': '^0.475.0',
          next: '^14.2.24',
          razorpay: '^2.9.5',
          react: '^18.3.1',
          'react-dom': '^18.3.1',
        },
        devDependencies: {
          '@types/node': '^20.17.0',
          '@types/react': '^18.3.12',
          '@types/react-dom': '^18.3.1',
          autoprefixer: '^10.4.20',
          postcss: '^8.4.49',
          tailwindcss: '^3.4.17',
          typescript: '^5.6.3',
        },
      },
      null,
      2
    ),

    'next.config.mjs': `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['assets.mixkit.co', 'images.unsplash.com', 'fal.media', 'fal-cdn.batuhan-941.workers.dev'],
  },
};

export default nextConfig;
`,

    'tsconfig.json': JSON.stringify(
      {
        compilerOptions: {
          lib: ['dom', 'dom.iterable', 'esnext'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          plugins: [{ name: 'next' }],
          paths: {
            '@/*': ['./*'],
          },
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
        exclude: ['node_modules'],
      },
      null,
      2
    ),

    'tailwind.config.ts': `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a12',
        card: '#18181b',
        border: '#27272a',
        purple: {
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
    },
  },
  plugins: [],
};
export default config;
`,

    'postcss.config.mjs': `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
`,

    '.gitignore': `node_modules
/.next/
/out/
.env*.local
.DS_Store
*.pem
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`,

    '.env.example': `# NexVerze Studio Environment Configuration (7 Keys Only)
FAL_KEY=your_fal_ai_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://vfrndplroxqkoubzstwd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_58cgkF4Y7klvRJhcs2FvZw_4g-E1LFh
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
`,

    'app/manifest.ts': `import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NexVerze Studio',
    short_name: 'Studio',
    description: 'AI Video Generation Platform with Quality Lock',
    start_url: '/studio',
    display: 'standalone',
    background_color: '#0a0a12',
    theme_color: '#0a0a12',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
`,

    'app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0a0a12;
  --foreground: #f4f4f5;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.mono {
  font-family: 'JetBrains Mono', monospace;
}

.galaxy-text {
  background: linear-gradient(100deg, #fff 20%, #a78bfa 60%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
`,

    'app/layout.tsx': `import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexVerze Studio — AI Video Generation',
  description: 'AI video generation powered by Luma Ray 3, Kling v2.5 Turbo Pro, and Veo 3.1 Fast with 1080x1920 Quality Lock.',
  themeColor: '#0a0a12',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a12] text-slate-100 min-h-screen antialiased selection:bg-[#8b5cf6] selection:text-white">
        {children}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
`,

    'lib/supabase.ts': `import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfrndplroxqkoubzstwd.supabase.co';
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_58cgkF4Y7klvRJhcs2FvZw_4g-E1LFh';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface StudioUser {
  id: string;
  email: string;
  credits: number;
  created_at?: string;
}

export interface StudioGeneration {
  id: string;
  user_id: string;
  email: string;
  prompt: string;
  model: 'luma' | 'kling' | 'veo' | string;
  duration?: '5s' | '8s' | '10s';
  credits_used: number;
  video_url: string;
  image_url?: string;
  status: 'completed' | 'processing' | 'failed';
  aspect_ratio?: '9:16' | '16:9' | '1:1';
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  email: string;
  order_id: string;
  payment_id: string;
  amount_inr: number;
  credits_added: number;
  created_at?: string;
}

// Profit pricing rounded (1cr = ₹0.70 flat)
export const MODEL_COST = {
  luma: { '5s': 50, '8s': 80, '10s': 100 },
  kling: { '5s': 120, '8s': 192, '10s': 240 },
  veo: { '8s': 400, '10s': 500 },
};

export const RAZORPAY_PACKS = [
  { id: 'starter', name: 'STARTER', credits: 500, amount: 350, comparison: '10 Luma 5s or 1 Veo 8s' },
  { id: 'pro', name: 'PRO', credits: 1200, amount: 750, comparison: '24 Luma or 3 Veo' },
  { id: 'power', name: 'POWER', credits: 3000, amount: 1500, comparison: '60 Luma or 7 Veo' },
];
`,

    'app/api/generate/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { createClient } from '@supabase/supabase-js';

const MODELS: Record<string, { text: string; image: string }> = {
  ltx: {
    text: 'fal-ai/ltx-video',
    image: 'fal-ai/ltx-video/image-to-video',
  },
  luma: {
    text: 'fal-ai/luma-dream-machine/ray-3',
    image: 'fal-ai/luma-dream-machine/ray-3/image-to-video',
  },
  wan: {
    text: 'fal-ai/wan/v2.1/text-to-video',
    image: 'fal-ai/wan/v2.1/image-to-video',
  },
  hunyuan: {
    text: 'fal-ai/hunyuan-video',
    image: 'fal-ai/hunyuan-video/image-to-video',
  },
  kling: {
    text: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
    image: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
  },
  veo: {
    text: 'fal-ai/veo3.1/fast/text-to-video',
    image: 'fal-ai/veo3.1/fast/image-to-video',
  },
};

const MODEL_COST: Record<string, Record<string, number>> = {
  ltx: { '5s': 15, '8s': 25, '10s': 35, '15s': 50 },
  luma: { '5s': 50, '8s': 80, '10s': 100, '15s': 150 },
  wan: { '5s': 80, '8s': 125, '10s': 160, '15s': 240 },
  hunyuan: { '5s': 90, '8s': 140, '10s': 180, '15s': 270 },
  kling: { '5s': 120, '8s': 192, '10s': 240, '15s': 360 },
  veo: { '5s': 250, '8s': 400, '10s': 500, '15s': 750 },
};

function getSupabaseServerClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfrndplroxqkoubzstwd.supabase.co';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_58cgkF4Y7klvRJhcs2FvZw_4g-E1LFh';

  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = 'luma', duration = '5s', imageUrl, aspect_ratio = '9:16', userId, email } = await req.json();

    if (!prompt && !imageUrl) {
      return NextResponse.json({ error: 'Prompt or image is required.' }, { status: 400 });
    }

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json(
        { error: 'FAL_KEY is not configured on server. Generation failed, try again.' },
        { status: 500 }
      );
    }

    const rawModelKey = (model === 'veo3' ? 'veo' : model) as string;
    const modelKey = MODELS[rawModelKey] ? rawModelKey : 'luma';
    const modelDef = MODELS[modelKey] || MODELS.luma;
    const cost = MODEL_COST[modelKey]?.[duration] || MODEL_COST[modelKey]?.['5s'] || 50;
    const modelId = imageUrl ? modelDef.image : modelDef.text;

    // Credit validation before generation
    const supabase = getSupabaseServerClient();
    let currentUser: { id: string; email: string; credits: number } | null = null;
    if (userId || email) {
      let query = supabase.from('studio_users').select('id, email, credits');
      if (userId) query = query.eq('id', userId);
      else if (email) query = query.eq('email', email.trim().toLowerCase());

      const { data: userData } = await query.maybeSingle();
      if (userData) {
        currentUser = userData;
        if (userData.credits < cost) {
          return NextResponse.json(
            {
              error: \`Insufficient credits. You have \${userData.credits}cr, but this generation requires \${cost}cr.\`,
              currentCredits: userData.credits,
              requiredCredits: cost,
            },
            { status: 402 }
          );
        }
      }
    }

    fal.config({ credentials: falKey });

    let durationInput: any = duration;
    if (modelKey === 'kling') {
      durationInput = duration === '5s' ? '5' : duration === '8s' ? '8' : '10';
    } else if (modelKey === 'veo') {
      durationInput = duration === '10s' ? '10s' : '8s';
    } else if (modelKey === 'wan') {
      durationInput = duration === '5s' ? 5 : duration === '8s' ? 8 : 5;
    } else {
      durationInput = duration;
    }

    const inputPayload: any = {
      prompt: prompt || 'High quality cinematic motion',
      aspect_ratio: aspect_ratio || '9:16',
      resolution: '1080p',
      duration: durationInput,
    };

    if (imageUrl) {
      inputPayload.image_url = imageUrl;
    }

    const result: any = await fal.subscribe(modelId, {
      input: inputPayload,
      logs: true,
    });

    const videoUrl =
      result?.data?.video?.url ||
      result?.data?.video_url ||
      result?.video?.url ||
      result?.video_url ||
      result?.output?.url;

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Generation failed, try again' },
        { status: 500 }
      );
    }

    // UPDATE BALANCE ONLY UPON SUCCESSFUL GENERATION
    let remainingCredits = currentUser ? currentUser.credits - cost : 50 - cost;
    if (currentUser?.id) {
      remainingCredits = Math.max(0, currentUser.credits - cost);
      await supabase.from('studio_users').update({ credits: remainingCredits }).eq('id', currentUser.id);

      await supabase.from('studio_generations').insert([
        {
          id: crypto.randomUUID(),
          user_id: currentUser.id,
          email: currentUser.email,
          prompt: (prompt || '').trim(),
          model: modelKey,
          duration,
          credits_used: cost,
          video_url: videoUrl,
          image_url: imageUrl || null,
          status: 'completed',
          aspect_ratio,
          created_at: new Date().toISOString(),
        },
      ]);
    }

    return NextResponse.json({
      video_url: videoUrl,
      cost,
      remaining_credits: remainingCredits,
      model: modelKey,
      duration,
      status: 'completed',
    });
  } catch (err: any) {
    console.error('Fal.ai generation error:', err);
    return NextResponse.json(
      { error: 'Generation failed, try again', details: err?.message },
      { status: 500 }
    );
  }
}
`,

    'app/api/razorpay/create-order/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  try {
    const { amount, credits, planId, email, userId } = await req.json();

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({
        id: \`order_\${Date.now()}\`,
        amount: Math.round(amount * 100),
        currency: 'INR',
        status: 'created',
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: \`rcpt_\${Date.now()}_\${userId || 'usr'}\`,
      notes: {
        credits: String(credits),
        planId: planId || 'plan',
        email: email || '',
        userId: userId || '',
      },
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json({
      ...order,
      key_id: keyId,
    });
  } catch (err: any) {
    console.error('Create order error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create Razorpay order' }, { status: 500 });
  }
}
`,

    'app/api/razorpay/verify/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      email,
      credits,
      amount,
    } = await req.json();

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keySecret && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(\`\${razorpay_order_id}|\${razorpay_payment_id}\`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid Razorpay payment signature.' }, { status: 400 });
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfrndplroxqkoubzstwd.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_58cgkF4Y7klvRJhcs2FvZw_4g-E1LFh';
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userRecord: any = null;
    const { data: existingUser } = await supabase
      .from('studio_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existingUser) {
      const newCredits = (existingUser.credits || 0) + Number(credits);
      const { data: updatedUser } = await supabase
        .from('studio_users')
        .update({ credits: newCredits })
        .eq('id', userId)
        .select()
        .single();
      userRecord = updatedUser;
    }

    await supabase.from('credit_transactions').insert([
      {
        id: crypto.randomUUID(),
        user_id: userId,
        email,
        order_id: razorpay_order_id || 'order',
        payment_id: razorpay_payment_id || 'payment',
        amount_inr: amount || 0,
        credits_added: credits,
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({
      success: true,
      message: \`Successfully credited \${credits} credits.\`,
      user: userRecord,
    });
  } catch (err: any) {
    console.error('Verify payment error:', err);
    return NextResponse.json({ error: err?.message || 'Verification failed.' }, { status: 500 });
  }
}
`,

    'README.md': `# NexVerze Studio (Next.js 14 App Router) - Oct 12 2026 Build

Production AI Video Studio for NexVerze Technologies.

## FAL ONLY Model Engines
- **Luma Fast**: \`fal-ai/luma-dream-machine/ray-3\` (Image-to-video: \`fal-ai/luma-dream-machine/ray-3/image-to-video\`)
  - 5s: 50cr (₹70) | 8s: 80cr (₹110) | 10s: 100cr (₹140)
- **Kling Pro**: \`fal-ai/kling-video/v2.5-turbo/pro/text-to-video\` (Image-to-video: \`fal-ai/kling-video/v2.5-turbo/pro/image-to-video\`)
  - 5s: 120cr (₹170) | 8s: 192cr (₹270) | 10s: 240cr (₹335)
- **Veo Ultra**: \`fal-ai/veo3.1/fast/text-to-video\` (Image-to-video: \`fal-ai/veo3.1/fast/image-to-video\`)
  - 8s: 400cr (₹560) | 10s: 500cr (₹700)

## Rounded Credit Packs (1cr = ₹0.70 Flat)
- **STARTER**: 500cr = ₹350 (10 Luma 5s or 1 Veo 8s)
- **PRO**: 1200cr = ₹750 popular (24 Luma or 3 Veo)
- **POWER**: 3000cr = ₹1500 (60 Luma or 7 Veo)

## Push to GitHub
\`\`\`bash
git init
git add .
git commit -m "feat: finalized FAL only Ray 3, v2.5 Turbo Pro, Veo 3.1 Fast, 10s durations, image-to-video, and rounded packs"
git branch -M main
git remote add origin https://github.com/Anand4tech/nexverze-studio.git
git push -u origin main --force
\`\`\`
`,
  };
}
