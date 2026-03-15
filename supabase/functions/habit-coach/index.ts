import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SYSTEM_PROMPT = `You are a supportive, knowledgeable habit coach.
You have access to the user's real habit data provided in each message.
Keep responses concise (2-4 sentences), warm, and actionable.
Focus on patterns, wins, and specific improvements the user can make.`

async function callClaude(system: string, messages: { role: string; content: string }[], maxTokens = 200) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system,
      messages,
    }),
  })
  return res.json()
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Auth is enforced by Supabase API gateway — the request only reaches
  // this function if the JWT is valid (see auth_user in request metadata)

  try {
    const body = await req.json()
    const { action, messages, context, text } = body

    // ---- Action: parse a natural language habit description ----
    if (action === 'parse_habit') {
      const system = `Extract habit info from natural language. Return ONLY valid JSON with:
- name: short habit name (3-5 words max)
- type: "good" if building a habit, "bad" if breaking one
- icon: a single relevant emoji

Examples:
"I want to exercise daily" → {"name":"Daily Exercise","type":"good","icon":"🏃"}
"I need to stop smoking" → {"name":"No Smoking","type":"bad","icon":"🚬"}`

      const data = await callClaude(system, [{ role: 'user', content: text }], 100)
      const parsed = JSON.parse(data.content[0].text)
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ---- Action: chat with habit coach ----
    if (action === 'chat') {
      const systemWithContext = context
        ? `${SYSTEM_PROMPT}\n\nUser's current habit data:\n${context}`
        : SYSTEM_PROMPT

      const data = await callClaude(systemWithContext, messages ?? [], 200)
      const reply = data.content?.[0]?.text ?? 'Sorry, I could not generate a response.'
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch {
    // H7: Return a generic error message — never expose internal error details
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
