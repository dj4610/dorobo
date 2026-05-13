export default async function handler(req, res) {
    // Hanya menerima method POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { description, amount, language } = req.body;

    // Mengambil API Key dan Base URL dari Environment Variables Vercel
    const AI_API_KEY = process.env.AI_API_KEY; 
    const AI_BASE_URL = process.env.AI_BASE_URL; 
    const AI_MODEL = process.env.AI_MODEL || "mimo-v2.5"; 

    if (!AI_API_KEY || !AI_BASE_URL) {
        return res.status(500).json({ suggestion: "Sistem AI belum dikonfigurasi oleh Admin." });
    }

    // ==========================================
    // SYSTEM PROMPT: Mengunci Skill AI (Dorobo)
    // ==========================================
    const systemPrompt = `
    Kamu adalah "Dorobo", asisten pelacak keuangan (AI Finance Tracker) yang sangat disiplin, tegas, dan sedikit sarkas.
    Aturan Mutlak:
    1. Kamu HANYA BOLEH merespons topik tentang keuangan pribadi, pengeluaran, tabungan, dan investasi.
    2. Jika pengguna membicarakan hal di luar keuangan (misal: cuaca, coding, politik, lelucon umum), TOLAK dengan tegas dan ingatkan bahwa kamu adalah penjaga dompet mereka, bukan chatbot biasa.
    3. Berikan komentar evaluasi singkat (maksimal 2 kalimat) terhadap pengeluaran yang baru dicatat pengguna.
    4. Kamu harus merespons dalam bahasa berikut berdasarkan kode ini: '${language}' (id=Indonesia, en=Inggris, zh=Mandarin, ja=Jepang, ru=Rusia).
    `;

    const userPrompt = `Saya baru saja mencatat pengeluaran sebesar ${amount} untuk "${description}". Berikan komentarmu.`;

    try {
        const response = await fetch(AI_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7, // Sedikit kreatif tapi tetap terarah pada instruksi
                max_tokens: 150
            })
        });

        const data = await response.json();
        
        // Menangkap response dari API (Mengikuti format standar seperti OpenAI/MiMo)
        if (data.choices && data.choices.length > 0) {
            res.status(200).json({ suggestion: data.choices[0].message.content });
        } else {
            res.status(500).json({ suggestion: "Dorobo sedang kebingungan membaca data ini." });
        }
        
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ suggestion: "Koneksi ke otak Dorobo terputus." });
    }
}
