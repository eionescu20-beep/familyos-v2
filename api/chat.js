export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Salvăm userul, dar dacă nu merge, NU stricăm AI-ul
    try {
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
    } catch (e) {}

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are FamilyOS, an elegant AI assistant for families. Answer warmly and practically in the user's language."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "FamilyOS este online ✨";

    // Salvăm răspunsul AI, dar dacă nu merge, NU stricăm AI-ul
    try {
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
    } catch (e) {}

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(200).json({
      reply: "FamilyOS este online, dar conexiunea AI trebuie verificată."
    });
  }
}
