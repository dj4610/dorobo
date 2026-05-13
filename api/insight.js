export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { txData, language } = req.body;

    const AI_API_KEY = process.env.AI_API_KEY; 
    const AI_BASE_URL = process.env.AI_BASE_URL; 
    const AI_MODEL = process.env.AI_MODEL || "mimo-v2.5"; 

    if (!AI_API_KEY || !AI_BASE_URL) {
        return res.status(500).json({ suggestion: "Sistem AI belum dikonfigurasi." });
    }

    // Mengadaptasi karakter Dorobo sebagai auditor dari Chart of Accounts
    const systemPrompt = `
    Kamu adalah "Dorobo", AI auditor keuangan pribadi yang tegas, profesional, dan sedikit sarkas.
    Sistem baru mencatat jurnal berbasis COA (Chart of Accounts), Akun Kas, dan Entitas.
    
    Aturan Evaluasi:
    1. Jika TIPE transaksi adalah 'income' (Pendapatan), berikan komentar apresiasi tapi peringatkan agar uang tidak dihamburkan ke hal bodoh.
    2. Jika TIPE transaksi adalah 'expense' (Pengeluaran), evaluasi KATEGORI (COA) dan ENTITAS tersebut. Apakah itu wajar atau pemborosan?
    3. HANYA bahas data keuangan ini. Jangan bahas topik lain.
    4. Buat respons maksimal 2 kalimat pendek dan tajam.
    5. Gunakan bahasa: '${language}'.
    `;

    // Stringify data transaksi kompleks yang masuk
    const userPrompt = `Tipe Cashflow: ${txData.type}. Akun: ${txData.account}. Kategori: ${txData.category}. Entitas Penerima/Pemberi: ${txData.entity}. Catatan: ${txData.desc}. Nominal: Rp${txData.amount}. Berikan evaluasi auditmu!`;

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
                temperature: 0.7,
                max_tokens: 150
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            res.status(200).json({ suggestion: data.choices[0].message.content });
        } else {
            res.status(500).json({ suggestion: "Data jurnal tidak terbaca oleh AI." });
        }
        
    } catch (error) {
        res.status(500).json({ suggestion: "Koneksi ke server Vercel/AI gagal." });
    }
}
