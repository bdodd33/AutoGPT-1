require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3001;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

app.use('/api/', limiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'hubby-helper-backend' }));

app.post('/api/generate-message', async (req, res) => {
  const { tone, occasion, partnerName, context } = req.body;

  if (!tone || !occasion) {
    return res.status(400).json({ error: 'tone and occasion are required' });
  }

  const toneLabels = {
    romantic: 'romantic', playful: 'playful', encouraging: 'encouraging',
    heartfelt: 'heartfelt', flirty: 'flirty',
  };
  const occasionLabels = {
    'just-because': 'just because', morning: 'good morning', goodnight: 'good night',
    apology: 'an apology', achievement: 'celebrating her achievement',
    anniversary: 'anniversary', custom: context || 'a special moment',
  };

  const toneStr = toneLabels[tone] || tone;
  const occasionStr = occasionLabels[occasion] || occasion;

  const prompt = [
    `Write a single ${toneStr} message for a man to send to his partner.`,
    partnerName ? `Her name is ${partnerName}.` : '',
    `Occasion: ${occasionStr}.`,
    context && occasion !== 'custom' ? `Additional context: ${context}.` : '',
    'The message should feel genuine, personal, and not overly long — 2-4 sentences maximum.',
    'Return only the message text, no quotes or explanation.',
  ].filter(Boolean).join(' ');

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
    return res.json({ message: text.trim() });
  } catch (err) {
    console.error('Claude API error:', err.message);
    return res.status(502).json({ error: 'Failed to generate message. Please try again.' });
  }
});

app.post('/api/gift-suggestions', async (req, res) => {
  const { occasion, budget, categories, partnerName, interests } = req.body;

  if (!occasion || !budget) {
    return res.status(400).json({ error: 'occasion and budget are required' });
  }

  const catStr = Array.isArray(categories) && categories.length > 0
    ? categories.join(', ')
    : 'any category';

  const prompt = [
    `Suggest 4 specific gift ideas for a man to give his partner.`,
    partnerName ? `Her name is ${partnerName}.` : '',
    `Occasion: ${occasion}. Budget: ${budget}. Categories: ${catStr}.`,
    interests ? `Her interests: ${interests}.` : '',
    '',
    'Return ONLY a JSON array with exactly this structure (no other text, no markdown):',
    '[{"title":"...","description":"...","priceRange":"...","category":"...","searchQuery":"...","why":"..."}]',
    'The searchQuery should be good Amazon search terms. The why explains in one sentence why she will love it.',
  ].filter(Boolean).join(' ');

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0]?.type === 'text' ? message.content[0].text : '[]';

    try {
      const match = text.match(/\[[\s\S]*\]/);
      const gifts = match ? JSON.parse(match[0]) : [];
      const amazonTag = process.env.AMAZON_ASSOCIATE_TAG || 'hubbyhelper-20';
      const enriched = gifts.map((g, i) => ({
        id: `gift_${Date.now()}_${i}`,
        ...g,
        amazonUrl: `https://www.amazon.com/s?k=${encodeURIComponent(g.searchQuery || g.title)}&tag=${amazonTag}`,
      }));
      return res.json({ gifts: enriched });
    } catch {
      return res.status(502).json({ error: 'Failed to parse gift suggestions.' });
    }
  } catch (err) {
    console.error('Claude API error:', err.message);
    return res.status(502).json({ error: 'Failed to fetch gift suggestions.' });
  }
});

app.post('/api/amazon-search', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query is required' });
  }

  const tag = process.env.AMAZON_ASSOCIATE_TAG || 'hubbyhelper-20';
  const url = `https://www.amazon.com/s?k=${encodeURIComponent(query.trim())}&tag=${tag}`;
  return res.json({ url });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Hubby Helper backend running on port ${PORT}`);
});
