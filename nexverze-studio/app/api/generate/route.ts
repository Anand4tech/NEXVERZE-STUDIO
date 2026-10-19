import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { createClient } from '@supabase/supabase-js';

// FAL ONLY MODEL SLUGS
const MODELS: Record<string, { text: string; image: string }> = {
  luma: {
    text: 'fal-ai/luma-dream-machine/ray-3',
    image: 'fal-ai/luma-dream-machine/ray-3/image-to-video',
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

// PROFIT PRICING MAPPING (1cr = ₹0.70 flat)
const MODEL_COST: Record<string, Record<string, number>> = {
  luma: { '5s': 50, '8s': 80, '10s': 100 },
  kling: { '5s': 120, '8s': 192, '10s': 240 },
  veo: { '8s': 400, '10s': 500 },
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
    const body = await req.json();
    const {
      prompt,
      model = 'luma',
      duration = '5s',
      imageUrl,
      aspect_ratio = '9:16',
      userId,
      email,
    } = body;

    if (!prompt && !imageUrl) {
      return NextResponse.json(
        { error: 'Prompt or image is required for video generation.' },
        { status: 400 }
      );
    }

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json(
        { error: 'FAL_KEY is not configured on server. Generation aborted, no credits deducted.' },
        { status: 500 }
      );
    }

    // 1. Resolve Model and Cost
    const modelKey = (model === 'veo3' ? 'veo' : model) as 'luma' | 'kling' | 'veo';
    const modelDef = MODELS[modelKey] || MODELS.luma;
    const requiredCredits = MODEL_COST[modelKey]?.[duration] || 50;
    const modelSlug = imageUrl ? modelDef.image : modelDef.text;

    // 2. Validate User Credits against Supabase `studio_users`
    const supabase = getSupabaseServerClient();
    let currentUser: { id: string; email: string; credits: number } | null = null;

    if (userId || email) {
      let query = supabase.from('studio_users').select('id, email, credits');
      if (userId) {
        query = query.eq('id', userId);
      } else if (email) {
        query = query.eq('email', email.trim().toLowerCase());
      }

      const { data: userData, error: userError } = await query.maybeSingle();

      if (userError) {
        console.warn('Supabase credit check warning:', userError.message);
      }

      if (userData) {
        currentUser = userData;

        // Strict Pre-Check: Do NOT call Fal if insufficient credits
        if (userData.credits < requiredCredits) {
          return NextResponse.json(
            {
              error: `Insufficient credits. You have ${userData.credits}cr, but this generation requires ${requiredCredits}cr.`,
              currentCredits: userData.credits,
              requiredCredits,
            },
            { status: 402 }
          );
        }
      }
    }

    // 3. Configure Fal.ai client
    fal.config({ credentials: falKey });

    // Duration mapping per engine requirements
    let durationParam: any = duration;
    if (modelKey === 'kling') {
      durationParam = duration === '5s' ? '5' : duration === '8s' ? '8' : '10';
    } else if (modelKey === 'veo') {
      durationParam = duration === '10s' ? '10s' : '8s';
    } else {
      durationParam = duration; // '5s', '8s', '10s'
    }

    const inputPayload: Record<string, any> = {
      prompt: prompt || 'High quality cinematic motion',
      aspect_ratio: aspect_ratio || '9:16',
      resolution: '1080p',
      duration: durationParam,
    };

    if (imageUrl) {
      inputPayload.image_url = imageUrl;
    }

    // 4. Submit to Fal.ai with logs
    console.log(`[FAL.AI] Executing: ${modelSlug} | Duration: ${durationParam}`);
    const result: any = await fal.subscribe(modelSlug, {
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
      throw new Error('Fal.ai returned empty video output URL.');
    }

    // 5. UPDATE BALANCE ONLY UPON SUCCESSFUL GENERATION
    let remainingCredits = currentUser ? currentUser.credits - requiredCredits : 50 - requiredCredits;

    if (currentUser?.id) {
      remainingCredits = Math.max(0, currentUser.credits - requiredCredits);

      const { error: updateError } = await supabase
        .from('studio_users')
        .update({ credits: remainingCredits })
        .eq('id', currentUser.id);

      if (updateError) {
        console.error('Failed to deduct user credits:', updateError.message);
      }

      // Record generation history in `studio_generations`
      await supabase.from('studio_generations').insert([
        {
          id: crypto.randomUUID(),
          user_id: currentUser.id,
          email: currentUser.email,
          prompt: (prompt || '').trim(),
          model: modelKey,
          duration,
          credits_used: requiredCredits,
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
      cost: requiredCredits,
      remaining_credits: remainingCredits,
      model: modelKey,
      duration,
      status: 'completed',
    });
  } catch (err: any) {
    console.error('Fal.ai generation error:', err);
    // Explicitly return failure without updating credit balance
    return NextResponse.json(
      {
        error: 'Generation failed, try again',
        details: err?.message,
      },
      { status: 500 }
    );
  }
}
