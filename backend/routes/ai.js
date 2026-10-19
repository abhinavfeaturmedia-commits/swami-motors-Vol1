import express from 'express';
import crypto from 'crypto';
import { query } from '../db.js';

const router = express.Router();

/**
 * Helper to fetch OpenRouter settings from MySQL dealership_settings or .env
 */
async function getOpenRouterConfig() {
    // Check .env first
    if (process.env.OPENROUTER_API_KEY) {
        return {
            apiKey: process.env.OPENROUTER_API_KEY,
            model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash',
            isEnabled: true
        };
    }

    // Check dealership_settings in MySQL
    try {
        const rows = await query("SELECT setting_value FROM dealership_settings WHERE setting_key = 'openrouter_settings' LIMIT 1");
        if (rows && rows.length > 0) {
            let val = rows[0].setting_value;
            if (typeof val === 'string') {
                try { val = JSON.parse(val); } catch (e) { val = {}; }
            }
            if (val && val.api_key) {
                return {
                    apiKey: val.api_key,
                    model: val.default_model || 'google/gemini-2.5-flash',
                    isEnabled: Boolean(val.is_enabled)
                };
            }
        }
    } catch (err) {
        console.error('Error fetching OpenRouter settings from DB:', err.message);
    }

    return { apiKey: '', model: 'google/gemini-2.5-flash', isEnabled: false };
}

/**
 * POST /api/ai/chat
 * Proxy endpoint to safely call OpenRouter without exposing the API key to frontend clients.
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, history = [], cars = [], sessionId, carId } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required' });
        }

        const config = await getOpenRouterConfig();

        if (!config.isEnabled || !config.apiKey) {
            return res.json({
                success: true,
                reply: "Thank you for reaching out to Shree Swami Samarth Motors! Our team is ready to assist you. You can browse our available cars in the Inventory section, book a test drive, or reach our sales executive directly on WhatsApp at 098232 37975."
            });
        }

        // Prepare context prompt
        let carListText = 'No specific vehicle listings loaded.';
        if (Array.isArray(cars) && cars.length > 0) {
            carListText = cars.slice(0, 15).map(c => 
                `- ${c.year} ${c.make} ${c.model}: ₹${(c.price / 100000).toFixed(2)} Lakh, ${c.fuel_type || 'Petrol'}, ${c.transmission || 'Manual'}, ${c.mileage ? c.mileage.toLocaleString('en-IN') + ' km' : 'N/A'}`
            ).join('\n');
        }

        const systemPrompt = `You are the polite, knowledgeable, and helpful AI Sales Assistant for "Shree Swami Samarth Motors" (SSSM Motors), a premier pre-owned car dealership in Kasaba Bawada, Kolhapur, Maharashtra.
Location: Kasaba Bawada Main Rd, Kasaba Bawada, Kolhapur, Maharashtra 416006.
Phone / WhatsApp: 098232 37975.
Key Services:
- Certified 200-point inspected pre-owned cars.
- Fast doorstep car evaluation and instant spot bank payment for sellers.
- RC transfer assistance at zero extra cost.
- Car loan/finance options with low EMIs and car insurance.
- Test drive booking and scheduled service maintenance.

Current Available Stock Highlights:
${carListText}

Tone & Guidelines:
1. Be warm, professional, and courteous.
2. Quote prices in Lakhs (e.g., ₹5.25 Lakh).
3. If the user asks about available cars, recommend matching cars from the available stock list above.
4. If a vehicle isn't in stock, assure them that Swami Motors can source it through their certified network, and invite them to leave their contact details or click 'Book Test Drive' / 'Request Callback'.
5. Keep responses concise (2-4 short paragraphs maximum) so it is easy to read on mobile screens.`;

        // Format conversation history for OpenRouter
        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        if (Array.isArray(history)) {
            for (const h of history.slice(-6)) { // keep last 6 turns
                if (h.sender === 'user' && h.text) {
                    messages.push({ role: 'user', content: h.text });
                } else if (h.sender === 'bot' && h.text) {
                    messages.push({ role: 'assistant', content: h.text });
                }
            }
        }

        messages.push({ role: 'user', content: message.trim() });

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://autokundali.com',
                'X-Title': 'Swami Motors CRM'
            },
            body: JSON.stringify({
                model: config.model,
                messages,
                temperature: 0.7,
                max_tokens: 800
            })
        });

        if (!openRouterResponse.ok) {
            const errBody = await openRouterResponse.json().catch(() => ({}));
            console.error('OpenRouter API error:', errBody);
            return res.json({
                success: true,
                reply: "Thank you for reaching out! We are currently experiencing high volume. You can check our inventory directly or contact our sales team at 098232 37975."
            });
        }

        const data = await openRouterResponse.json();
        const reply = data.choices?.[0]?.message?.content || "Thank you for contacting Shree Swami Samarth Motors. How else can we assist you?";
        const trimmedReply = reply.trim();

        // ─── Persist Chat Interaction to MySQL (ai_chat_logs) ─────────────────
        const logId = crypto.randomUUID();
        const session = sessionId || 'anon-session';
        const cleanMessage = message.trim();

        // Detect phone number (Indian 10-digit mobile number)
        const phoneRegex = /(?:(?:\+|0{0,2})91[\s-]*)?([6-9]\d{9})/;
        const matchPhone = cleanMessage.match(phoneRegex);
        const detectedPhone = matchPhone ? matchPhone[1] : null;

        try {
            await query(
                `INSERT INTO ai_chat_logs (id, session_id, user_message, ai_reply, detected_phone, car_id, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [logId, session, cleanMessage, trimmedReply, detectedPhone, carId || null]
            );

            // If user mentioned phone number, automatically create or log lead in MySQL leads table
            if (detectedPhone) {
                const leadId = crypto.randomUUID();
                const leadMessage = `AI Chatbot conversation inquiry: "${cleanMessage.slice(0, 300)}"`;
                await query(
                    `INSERT INTO leads (id, type, full_name, phone, message, source, status, created_at, updated_at)
                     VALUES (?, 'ai_chatbot', 'Chatbot Visitor', ?, ?, 'ai_chatbot', 'new', NOW(), NOW())`,
                    [leadId, detectedPhone, leadMessage]
                );
                console.log(`✅ Automated lead captured from AI chat for phone: ${detectedPhone}`);
            }
        } catch (dbErr) {
            console.error('Error persisting AI chat log / lead to MySQL:', dbErr.message);
        }

        return res.json({
            success: true,
            reply: trimmedReply
        });

    } catch (err) {
        console.error('AI chat endpoint error:', err);
        return res.status(500).json({
            success: false,
            error: 'Server error processing AI response',
            reply: "Our dealership team is happy to assist you directly at 098232 37975."
        });
    }
});

export default router;
