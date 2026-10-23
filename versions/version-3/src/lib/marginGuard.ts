import { ModelType, DurationType, MODEL_COST } from './modelConfig';
import { StudioGeneration } from './supabase';

export interface ApiConsumptionLog {
  id: string;
  timestamp: string;
  model: ModelType;
  duration: DurationType;
  creditsDeducted: number;
  revenueInr: number;
  apiCostUsd: number;
  apiCostInr: number;
  profitInr: number;
  marginPercent: number;
  status: 'healthy' | 'warning_low_margin';
}

export interface MarginAlert {
  id: string;
  timestamp: string;
  model: ModelType;
  duration: DurationType;
  currentCreditCost: number;
  currentMarginPercent: number;
  recommendedCreditCost: number;
  apiCostUsd: number;
  message: string;
  severity: 'warning' | 'critical';
}

// Real-world wholesale API costs billed by Fal.ai / AI infrastructure providers (in USD)
export const ESTIMATED_API_COSTS_USD: Record<ModelType, Record<DurationType, number>> = {
  ltx: {
    '5s': 0.04,
    '8s': 0.06,
    '10s': 0.08,
    '15s': 0.12,
  },
  luma: {
    '5s': 0.15,
    '8s': 0.24,
    '10s': 0.30,
    '15s': 0.45,
  },
  wan: {
    '5s': 0.20,
    '8s': 0.32,
    '10s': 0.40,
    '15s': 0.60,
  },
  hunyuan: {
    '5s': 0.25,
    '8s': 0.40,
    '10s': 0.50,
    '15s': 0.75,
  },
  kling: {
    '5s': 0.35,
    '8s': 0.56,
    '10s': 0.70,
    '15s': 1.05,
  },
  veo: {
    '5s': 0.80,
    '8s': 1.28,
    '10s': 1.60,
    '15s': 2.40,
  },
};

// Global currency conversions & credit valuation
export const USD_TO_INR_RATE = 94.89; // Current exchange reference (1 USD = ₹94.89)
export const VALUE_PER_CREDIT_INR = 0.532; // Worst-case net credit realization (₹2,999 / 5,500 cr less ~2.36% Razorpay fee)
export const RETAIL_CREDIT_VALUE_INR = 0.66; // Nano Trial retail realization (₹99 / 150 cr)
export const MIN_ACCEPTABLE_MARGIN_PERCENT = 50.0; // 50% Profit Safeguard Floor

const STORAGE_KEY_LOGS = 'nexverze_api_consumption_logs';
const STORAGE_KEY_ALERTS = 'nexverze_margin_alerts';

/**
 * Logs API consumption along with credit deduction in real time.
 * Calculates exact wholesale API cost vs credit revenue and records profit margin.
 */
export function logApiConsumption(
  model: ModelType,
  duration: DurationType = '5s',
  creditsDeducted: number
): ApiConsumptionLog {
  const apiCostUsd = ESTIMATED_API_COSTS_USD[model]?.[duration] ?? 0.15;
  const apiCostInr = Number((apiCostUsd * USD_TO_INR_RATE).toFixed(2));
  const revenueInr = Number((creditsDeducted * VALUE_PER_CREDIT_INR).toFixed(2));
  const profitInr = Number((revenueInr - apiCostInr).toFixed(2));

  // Profit Margin = ((Revenue - Cost) / Revenue) * 100
  const marginPercent = revenueInr > 0 ? Number((((revenueInr - apiCostInr) / revenueInr) * 100).toFixed(1)) : 0;
  const status = marginPercent < MIN_ACCEPTABLE_MARGIN_PERCENT ? 'warning_low_margin' : 'healthy';

  const entry: ApiConsumptionLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    model,
    duration,
    creditsDeducted,
    revenueInr,
    apiCostUsd,
    apiCostInr,
    profitInr,
    marginPercent,
    status,
  };

  try {
    if (typeof window !== 'undefined') {
      const existingStr = localStorage.getItem(STORAGE_KEY_LOGS);
      const logs: ApiConsumptionLog[] = existingStr ? JSON.parse(existingStr) : [];
      // Keep last 250 logs
      logs.unshift(entry);
      if (logs.length > 250) logs.pop();
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));

      // Trigger custom event so any active UI listener can update live
      window.dispatchEvent(new CustomEvent('nexverze_consumption_logged', { detail: entry }));
    }
  } catch (err) {
    console.error('[MarginGuard] Failed to save log to localStorage:', err);
  }

  // Console monitor output for server and client inspection
  if (status === 'warning_low_margin') {
    console.warn(
      `[MARGIN GUARD ALERT] Model "${model}" (${duration}) margin is ${marginPercent}% (< 50% target!). Real API Cost: $${apiCostUsd} (₹${apiCostInr}) vs Revenue: ₹${revenueInr}.`
    );
  } else {
    console.log(
      `[MARGIN GUARD OK] Model "${model}" (${duration}) healthy: ${marginPercent}% margin. Profit: +₹${profitInr}`
    );
  }

  return entry;
}

/**
 * Returns stored consumption logs
 */
export function getStoredApiConsumptionLogs(): ApiConsumptionLog[] {
  try {
    if (typeof window !== 'undefined') {
      const existingStr = localStorage.getItem(STORAGE_KEY_LOGS);
      return existingStr ? JSON.parse(existingStr) : [];
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

/**
 * Periodically or on-demand compares real-world API costs against current credit pricing.
 * If any model configuration yields a margin below 50%, an actionable alert is generated.
 */
export function checkModelProfitMargins(): {
  allHealthy: boolean;
  alerts: MarginAlert[];
  marginsOverview: Record<
    string,
    {
      model: ModelType;
      duration: DurationType;
      creditCost: number;
      revenueInr: number;
      apiCostInr: number;
      apiCostUsd: number;
      marginPercent: number;
      isBelowThreshold: boolean;
    }
  >;
} {
  const alerts: MarginAlert[] = [];
  const marginsOverview: Record<string, any> = {};
  const models: ModelType[] = ['ltx', 'luma', 'wan', 'hunyuan', 'kling', 'veo'];
  const durations: DurationType[] = ['5s', '8s', '10s', '15s'];

  for (const model of models) {
    for (const duration of durations) {
      const creditCost = MODEL_COST[model]?.[duration];
      if (creditCost === undefined) continue;

      const apiCostUsd = ESTIMATED_API_COSTS_USD[model]?.[duration] ?? 0.15;
      const apiCostInr = apiCostUsd * USD_TO_INR_RATE;
      const revenueInr = creditCost * VALUE_PER_CREDIT_INR;
      const marginPercent = revenueInr > 0 ? Number((((revenueInr - apiCostInr) / revenueInr) * 100).toFixed(1)) : 0;
      const isBelowThreshold = marginPercent < MIN_ACCEPTABLE_MARGIN_PERCENT;

      const key = `${model}-${duration}`;
      marginsOverview[key] = {
        model,
        duration,
        creditCost,
        revenueInr: Number(revenueInr.toFixed(2)),
        apiCostInr: Number(apiCostInr.toFixed(2)),
        apiCostUsd,
        marginPercent,
        isBelowThreshold,
      };

      if (isBelowThreshold) {
        // Calculate recommended credit cost to achieve at least 55% margin
        // (Revenue - Cost) / Revenue = 0.55 => Revenue * 0.45 = Cost => Revenue = Cost / 0.45
        const targetRevenueInr = apiCostInr / 0.45;
        const recommendedCredits = Math.ceil(targetRevenueInr / VALUE_PER_CREDIT_INR);

        const alert: MarginAlert = {
          id: `margin-alert-${model}-${duration}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          model,
          duration,
          currentCreditCost: creditCost,
          currentMarginPercent: marginPercent,
          recommendedCreditCost: recommendedCredits,
          apiCostUsd,
          message: `Margin for ${model.toUpperCase()} (${duration}) is ${marginPercent}% (target >= 50%). Real API wholesale cost is $${apiCostUsd.toFixed(2)} (₹${apiCostInr.toFixed(0)}), but current credit yield is ₹${revenueInr.toFixed(0)}. Increase credit cost to ${recommendedCredits} cr to safeguard 55%+ margin.`,
          severity: marginPercent < 30 ? 'critical' : 'warning',
        };
        alerts.push(alert);
      }
    }
  }

  // Save latest alerts to localStorage
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
      if (alerts.length > 0) {
        window.dispatchEvent(new CustomEvent('nexverze_margin_alert_triggered', { detail: alerts }));
      }
    }
  } catch (err) {
    console.error('[MarginGuard] Failed to save alerts:', err);
  }

  return {
    allHealthy: alerts.length === 0,
    alerts,
    marginsOverview,
  };
}

/**
 * Starts a background periodic margin comparison runner (defaults to every 15 minutes)
 */
export function startPeriodicMarginMonitor(
  intervalMinutes: number = 15,
  onAlertTriggered?: (alerts: MarginAlert[]) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  // Initial check
  const initial = checkModelProfitMargins();
  if (!initial.allHealthy && onAlertTriggered) {
    onAlertTriggered(initial.alerts);
  }

  const intervalId = setInterval(() => {
    const res = checkModelProfitMargins();
    if (!res.allHealthy) {
      console.warn(`[MarginGuard Periodic Monitor] ${res.alerts.length} margin warnings detected!`);
      if (onAlertTriggered) {
        onAlertTriggered(res.alerts);
      }
    }
  }, intervalMinutes * 60 * 1000);

  return () => clearInterval(intervalId);
}

export const STORAGE_KEY_DAILY_CHECK = 'nexverze_last_daily_margin_check';
export const STORAGE_KEY_DAILY_ALERTS = 'nexverze_daily_margin_alerts';

export interface ModelMarginDifference {
  model: ModelType;
  modelName: string;
  generationCount: number;
  totalCreditsUsed: number;
  totalRevenueInr: number;
  totalApiCostUsd: number;
  totalApiCostInr: number;
  netProfitInr: number;
  averageMarginPercent: number;
  // Baseline configured settings
  configuredCreditCost5s: number;
  configuredRevenueInr5s: number;
  configuredApiCostUsd5s: number;
  configuredApiCostInr5s: number;
  configuredMarginPercent5s: number;
  // Variance
  marginDifference: number; // actual realized margin - configured margin
  costDifferenceInr: number; // total revenue - total API cost
  isBelow50Percent: boolean;
  recommendedCreditCost: number;
}

export interface MarginDifferenceAnalysis {
  timestamp: string;
  totalGenerationsAnalyzed: number;
  totalRevenueInr: number;
  totalApiCostInr: number;
  totalNetProfitInr: number;
  overallAverageMarginPercent: number;
  models: Record<ModelType, ModelMarginDifference>;
  lowMarginModels: ModelMarginDifference[];
  hasLowMarginModels: boolean;
}

const MODEL_NAMES: Record<ModelType, string> = {
  ltx: 'LTX-Video Fast',
  luma: 'Luma Dream Machine',
  wan: 'Wan 2.1 Video',
  hunyuan: 'Hunyuan Video',
  kling: 'Kling Pro 1.5',
  veo: 'Google Veo Ultra',
};

/**
 * Normalizes generation model string into a known ModelType.
 */
function resolveModelType(rawModel: string): ModelType {
  const norm = (rawModel || '').toLowerCase().trim();
  if (norm.includes('ltx')) return 'ltx';
  if (norm.includes('luma')) return 'luma';
  if (norm.includes('wan')) return 'wan';
  if (norm.includes('hunyuan')) return 'hunyuan';
  if (norm.includes('kling')) return 'kling';
  if (norm.includes('veo')) return 'veo';
  return 'luma';
}

/**
 * Calculates the difference between current 'model_cost' settings and actual API usage costs
 * logged in 'studio_generations'.
 *
 * Can accept generations directly, or falls back to reading history from localStorage.
 */
export function calculateModelCostVsApiMargin(
  generations?: StudioGeneration[]
): MarginDifferenceAnalysis {
  let genList = generations;

  if (!genList && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('nexverze_studio_history');
      if (stored) {
        genList = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[MarginGuard] Failed to parse stored history:', e);
    }
  }

  const items = genList || [];
  const modelsList: ModelType[] = ['ltx', 'luma', 'wan', 'hunyuan', 'kling', 'veo'];
  const modelsAnalysis: Record<ModelType, ModelMarginDifference> = {} as any;
  const lowMarginModels: ModelMarginDifference[] = [];

  let overallRevenueInr = 0;
  let overallApiCostInr = 0;
  let overallGenerations = 0;

  for (const model of modelsList) {
    // Current configured model_cost settings (using 5s baseline reference)
    const configuredCreditCost5s = MODEL_COST[model]?.['5s'] ?? 25;
    const configuredRevenueInr5s = Number((configuredCreditCost5s * VALUE_PER_CREDIT_INR).toFixed(2));
    const configuredApiCostUsd5s = ESTIMATED_API_COSTS_USD[model]?.['5s'] ?? 0.15;
    const configuredApiCostInr5s = Number((configuredApiCostUsd5s * USD_TO_INR_RATE).toFixed(2));
    const configuredMarginPercent5s =
      configuredRevenueInr5s > 0
        ? Number((((configuredRevenueInr5s - configuredApiCostInr5s) / configuredRevenueInr5s) * 100).toFixed(1))
        : 0;

    // Filter actual usage records logged in studio_generations
    const modelGens = items.filter((g) => resolveModelType(g.model) === model);
    const generationCount = modelGens.length;

    let totalCreditsUsed = 0;
    let totalApiCostUsd = 0;

    for (const gen of modelGens) {
      const dur: DurationType = (gen.duration as DurationType) || '5s';
      const unitApiCostUsd = ESTIMATED_API_COSTS_USD[model]?.[dur] ?? configuredApiCostUsd5s;
      totalCreditsUsed += gen.credits_used || configuredCreditCost5s;
      totalApiCostUsd += unitApiCostUsd;
    }

    const totalRevenueInr = Number((totalCreditsUsed * VALUE_PER_CREDIT_INR).toFixed(2));
    const totalApiCostInr = Number((totalApiCostUsd * USD_TO_INR_RATE).toFixed(2));
    const netProfitInr = Number((totalRevenueInr - totalApiCostInr).toFixed(2));

    // If actual generations exist, calculate realized margin; otherwise fall back to configured baseline
    const averageMarginPercent =
      generationCount > 0 && totalRevenueInr > 0
        ? Number((((totalRevenueInr - totalApiCostInr) / totalRevenueInr) * 100).toFixed(1))
        : configuredMarginPercent5s;

    // Difference between actual realized margin and configured baseline setting
    const marginDifference = Number((averageMarginPercent - configuredMarginPercent5s).toFixed(1));
    const costDifferenceInr = netProfitInr;
    const isBelow50Percent = averageMarginPercent < MIN_ACCEPTABLE_MARGIN_PERCENT;

    // Recommended credit cost if below 50% target to restore 55%+ safe margin
    const baseCostInr = generationCount > 0 ? totalApiCostInr / generationCount : configuredApiCostInr5s;
    const targetRevenueInr = baseCostInr / 0.45;
    const recommendedCreditCost = Math.ceil(targetRevenueInr / VALUE_PER_CREDIT_INR);

    const diff: ModelMarginDifference = {
      model,
      modelName: MODEL_NAMES[model] || model.toUpperCase(),
      generationCount,
      totalCreditsUsed,
      totalRevenueInr,
      totalApiCostUsd: Number(totalApiCostUsd.toFixed(3)),
      totalApiCostInr,
      netProfitInr,
      averageMarginPercent,
      configuredCreditCost5s,
      configuredRevenueInr5s,
      configuredApiCostUsd5s,
      configuredApiCostInr5s,
      configuredMarginPercent5s,
      marginDifference,
      costDifferenceInr,
      isBelow50Percent,
      recommendedCreditCost,
    };

    modelsAnalysis[model] = diff;

    if (isBelow50Percent) {
      lowMarginModels.push(diff);
    }

    overallGenerations += generationCount;
    overallRevenueInr += totalRevenueInr;
    overallApiCostInr += totalApiCostInr;
  }

  const totalNetProfitInr = Number((overallRevenueInr - overallApiCostInr).toFixed(2));
  const overallAverageMarginPercent =
    overallRevenueInr > 0
      ? Number((((overallRevenueInr - overallApiCostInr) / overallRevenueInr) * 100).toFixed(1))
      : Number(
          (
            modelsList.reduce((acc, m) => acc + modelsAnalysis[m].configuredMarginPercent5s, 0) /
            modelsList.length
          ).toFixed(1)
        );

  return {
    timestamp: new Date().toISOString(),
    totalGenerationsAnalyzed: overallGenerations,
    totalRevenueInr: Number(overallRevenueInr.toFixed(2)),
    totalApiCostInr: Number(overallApiCostInr.toFixed(2)),
    totalNetProfitInr,
    overallAverageMarginPercent,
    models: modelsAnalysis,
    lowMarginModels,
    hasLowMarginModels: lowMarginModels.length > 0,
  };
}

// Alias for convenience matching user prompt
export const calculateModelCostMarginDifference = calculateModelCostVsApiMargin;

/**
 * Daily check that triggers a console/system alert if the average profit margin drops below 50%
 * for any model.
 *
 * @param generations Optional generations array. If omitted, fetched from local storage.
 * @param force If true, ignores 24-hour interval and runs immediately.
 */
export function runDailyMarginCheck(
  generations?: StudioGeneration[],
  force: boolean = false
): {
  ran: boolean;
  alertTriggered: boolean;
  lowMarginModels: ModelMarginDifference[];
  analysis: MarginDifferenceAnalysis;
  message: string;
} {
  const analysis = calculateModelCostVsApiMargin(generations);

  if (typeof window !== 'undefined') {
    const lastCheck = localStorage.getItem(STORAGE_KEY_DAILY_CHECK);
    const now = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    if (!force && lastCheck) {
      const elapsed = now - new Date(lastCheck).getTime();
      if (elapsed < twentyFourHoursMs) {
        return {
          ran: false,
          alertTriggered: false,
          lowMarginModels: analysis.lowMarginModels,
          analysis,
          message: `Daily margin check already ran today (${Math.round((twentyFourHoursMs - elapsed) / 3600000)}h remaining until next automated check).`,
        };
      }
    }

    // Save timestamp of daily run
    localStorage.setItem(STORAGE_KEY_DAILY_CHECK, new Date().toISOString());
  }

  // Trigger Console and System Alerts if any model drops below 50%
  if (analysis.hasLowMarginModels) {
    const modelNames = analysis.lowMarginModels.map((m) => `${m.model.toUpperCase()} (${m.averageMarginPercent}%)`).join(', ');
    const alertMessage = `🚨 [DAILY MARGIN GUARD SYSTEM ALERT] Profit margin dropped BELOW 50% floor on ${analysis.lowMarginModels.length} model(s): ${modelNames}! Realized API costs are outstripping credit settings.`;

    console.warn(
      `%c🚨 [DAILY MARGIN GUARD SYSTEM ALERT]`,
      'background: #dc2626; color: #ffffff; font-weight: bold; font-size: 13px; padding: 4px 10px; border-radius: 4px;'
    );
    console.warn(alertMessage);
    console.table(
      analysis.lowMarginModels.map((m) => ({
        Model: m.modelName,
        Generations: m.generationCount,
        'Avg Realized Margin': `${m.averageMarginPercent}%`,
        'Configured Margin': `${m.configuredMarginPercent5s}%`,
        'Margin Variance': `${m.marginDifference > 0 ? '+' : ''}${m.marginDifference}%`,
        'Total Revenue': `₹${m.totalRevenueInr}`,
        'Wholesale API Cost': `₹${m.totalApiCostInr}`,
        'Net Profit': `₹${m.netProfitInr}`,
        'Recommended Credit Cost': `${m.recommendedCreditCost} cr`,
      }))
    );

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY_DAILY_ALERTS,
          JSON.stringify({
            timestamp: analysis.timestamp,
            lowMarginModels: analysis.lowMarginModels,
            analysis,
          })
        );

        // Dispatch system-wide events
        window.dispatchEvent(
          new CustomEvent('nexverze_daily_margin_alert', {
            detail: {
              timestamp: analysis.timestamp,
              lowMarginModels: analysis.lowMarginModels,
              analysis,
            },
          })
        );

        // Map to standard MarginAlert format to update any active UI badges/modals
        const standardAlerts: MarginAlert[] = analysis.lowMarginModels.map((m) => ({
          id: `daily-alert-${m.model}-${Date.now()}`,
          timestamp: analysis.timestamp,
          model: m.model,
          duration: '5s',
          currentCreditCost: m.configuredCreditCost5s,
          currentMarginPercent: m.averageMarginPercent,
          recommendedCreditCost: m.recommendedCreditCost,
          apiCostUsd: m.configuredApiCostUsd5s,
          message: `Daily Audit: ${m.model.toUpperCase()} margin is ${m.averageMarginPercent}% (< 50% floor target!). Adjust credit cost from ${m.configuredCreditCost5s} cr to ${m.recommendedCreditCost} cr to preserve safe 55%+ margins.`,
          severity: m.averageMarginPercent < 30 ? 'critical' : 'warning',
        }));

        window.dispatchEvent(
          new CustomEvent('nexverze_margin_alert_triggered', {
            detail: standardAlerts,
          })
        );
      } catch (e) {
        console.error('[MarginGuard] Failed to dispatch daily alert event:', e);
      }
    }

    return {
      ran: true,
      alertTriggered: true,
      lowMarginModels: analysis.lowMarginModels,
      analysis,
      message: alertMessage,
    };
  }

  // Healthy log
  console.log(
    `%c✅ [DAILY MARGIN GUARD HEALTHY]`,
    'background: #059669; color: #ffffff; font-weight: bold; font-size: 12px; padding: 3px 8px; border-radius: 4px;'
  );
  console.log(
    `All AI models are operating profitably with margins >= 50%. Overall System Margin: ${analysis.overallAverageMarginPercent}% across ${analysis.totalGenerationsAnalyzed} generation(s). Net Profit: +₹${analysis.totalNetProfitInr}.`
  );

  return {
    ran: true,
    alertTriggered: false,
    lowMarginModels: [],
    analysis,
    message: 'All models maintaining healthy profit margins above 50%.',
  };
}

/**
 * Initializes the automated daily margin check system.
 * Runs once upon app boot if > 24 hours have passed since last check,
 * and sets an hourly scheduler to ensure continuous daily surveillance.
 */
export function initDailyMarginCheck(generations?: StudioGeneration[]): () => void {
  if (typeof window === 'undefined') return () => {};

  // Check immediately if 24 hours have elapsed
  runDailyMarginCheck(generations);

  // Hourly heartbeat to trigger whenever the 24-hour mark is crossed
  const intervalId = setInterval(() => {
    runDailyMarginCheck(generations);
  }, 60 * 60 * 1000);

  return () => clearInterval(intervalId);
}

