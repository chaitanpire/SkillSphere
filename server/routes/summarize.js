const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Aixplain API details
const AIXPLAIN_API_URL = 'https://models.aixplain.com/api/v1/chat/completions';
const AIXPLAIN_API_KEY = '2daee4480c2a62f87e472fb681d871057dcece65c58c02c692cbd59470b215a0';

router.post('/', async (req, res) => {
    const { coverLetter } = req.body;

    if (!coverLetter) {
        return res.status(400).json({ error: 'Cover letter is required' });
    }

    try {
        const response = await fetch(AIXPLAIN_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AIXPLAIN_API_KEY}`
            },
            body: JSON.stringify({
                model: "6646261c6eb563165658bbb1",
                messages: [
                    {
                        role: "system",
                        content: "You are a summarization assistant."
                    },
                    {
                        role: "user",
                        content: `Summarize the following text: ${coverLetter}`
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error('Failed to summarize the cover letter');
        }

        const data = await response.json();
        const summary = data.choices[0].message.content;

        res.json({ summary });
    } catch (err) {
        console.error('Error summarizing cover letter:', err);
        res.status(500).json({ error: 'Failed to summarize the cover letter' });
    }
});

module.exports = router;