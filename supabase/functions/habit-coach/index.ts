import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are a supportive, knowledgeable habit coach.
You have access to the user's real habit data provided in each message.
Keep responses concise (2-4 sentences), warm, and actionable.
Focus on patterns, wins, and specific improvements the user can make.`

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const body = await req.json()
    const { action, messages, context, text } = body

    // ---- Action: parse a natural language habit description ----
    if (action === 'parse_habit') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `Extract habit info from natural language. Return JSON with:
- name: short habit name (3-5 words max)
- type: "good" if building a habit, "bad" if breaking one
- icon: a single relevant emoji

Examples:
"I want to exercise daily" → {"name":"Daily Exercise","type":"good","icon":"🏃"}
"I need to stop smoking" → {"name":"No Smoking","type":"bad","icon":"🚬"}`,
            },
            { role: 'user', content: text },
          ],
        }),
      })

      const data = await res.json()
      const parsed = JSON.parse(data.choices[0].message.content)
      return new Response(JSON.stringify(parsed), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // ---- Action: chat with habit coach ----
    if (action === 'chat') {
      const systemWithContext = context
        ? `${SYSTEM_PROMPT}\n\nUser's current habit data:\n${context}`
        : SYSTEM_PROMPT

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 200,
          messages: [
            { role: 'system', content: systemWithContext },
            ...(messages ?? []),
          ],
        }),
      })

      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.'
      return new Response(JSON.stringify({ reply }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
