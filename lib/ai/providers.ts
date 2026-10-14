/* =============================================
   AI Provider Chain (server-only)
   Tries providers in order until one answers:
   Gemini → NVIDIA NIM → Grok (xAI)
   All three expose OpenAI-compatible chat APIs,
   so one client covers them all.
   ============================================= */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResult {
  reply: string;
  provider: string;
  model: string;
}

interface ProviderConfig {
  name: string;
  url: string;
  key: string | undefined;
  model: string;
}

const PROVIDER_TIMEOUT_MS = 25_000;

function buildProviders(): ProviderConfig[] {
  const registry: Record<string, ProviderConfig> = {
    gemini: {
      name: 'gemini',
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      key: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    },
    nvidia: {
      name: 'nvidia',
      url: 'https://integrate.api.nvidia.com/v1/chat/completions',
      key: process.env.NVIDIA_API_KEY,
      model: process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct',
    },
    grok: {
      name: 'grok',
      url: 'https://api.x.ai/v1/chat/completions',
      key: process.env.GROK_API_KEY || process.env.XAI_API_KEY,
      model: process.env.GROK_MODEL || 'grok-3-mini',
    },
  };

  const order = (process.env.AI_PROVIDER_ORDER || 'gemini,nvidia,grok')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => registry[s]);

  return order.map(name => registry[name]).filter(p => !!p.key);
}

/** True when at least one provider has an API key configured */
export function hasConfiguredProvider(): boolean {
  return buildProviders().length > 0;
}

async function callProvider(provider: ProviderConfig, messages: AIMessage[]): Promise<AIResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  try {
    const res = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.key}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: 0.6,
        max_tokens: 700,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${provider.name} HTTP ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error(`${provider.name}: empty completion`);

    return { reply, provider: provider.name, model: provider.model };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask the first available provider; fall through the chain on any failure.
 * Throws only when every configured provider fails (or none are configured).
 */
export async function askAI(messages: AIMessage[]): Promise<AIResult> {
  const providers = buildProviders();
  if (providers.length === 0) {
    throw new Error('No AI provider configured (set GEMINI_API_KEY, NVIDIA_API_KEY or GROK_API_KEY)');
  }

  const errors: string[] = [];
  for (const provider of providers) {
    try {
      return await callProvider(provider, messages);
    } catch (err: any) {
      const msg = err?.name === 'AbortError' ? `${provider.name}: timed out` : (err?.message || String(err));
      console.warn(`[AI] Provider failed → falling through: ${msg}`);
      errors.push(msg);
    }
  }
  throw new Error(`All AI providers failed: ${errors.join(' | ')}`);
}
