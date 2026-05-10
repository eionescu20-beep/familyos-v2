import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message } = req.body

    // SAVE TO SUPABASE
    await supabase.from('messages').insert([
      {
        role: 'user',
        content: message
      }
    ])

    // OPENAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are FamilyOS AI assistant.'
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    })

    const data = await response.json()

    const aiReply = data.choices[0].message.content

    // SAVE AI RESPONSE
    await supabase.from('messages').insert([
      {
        role: 'assistant',
        content: aiReply
      }
    ])

    res.status(200).json({
      reply: aiReply
    })

  } catch (error) {
    console.log(error)

    res.status(500).json({
      error: 'Something went wrong'
    })
  }
}
