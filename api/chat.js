export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message } = req.body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Salvăm mesajul userului în Supabase
    if (supabaseUrl && supabaseKey && message) {
      await fetch(`${supabaseUrl}/rest/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          role: "user",
          content: message
        })
      });
    }

    // Trimitem mesajul către OpenAI
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "You are FamilyOS, an elegant AI assistant for families. Help with schedules, reminders, shopping lists, children routines, finances, meals and calm daily planning. Answer clearly, warmly and practically."
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "FamilyOS este online ✨";

    // Salvăm răspunsul AI în Supabase
    if (supabaseUrl && supabaseKey && reply) {
      await fetch(`${supabaseUrl}/rest/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          role: "assistant",
          content: reply
        })
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "AI error"
    });
  }
}
