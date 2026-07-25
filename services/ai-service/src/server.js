// Expone operaciones NLP sin dependencias de pago.
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import {
  analyzeSentiment,
  analyzeStatistics,
  classifyText,
  extractKeywords,
  normalizeText,
  summarizeText
} from './nlp.js';

const app = express();
const port = Number(process.env.PORT || 4002);
const host = process.env.HOST || '0.0.0.0';
const textSchema = z.object({ text: z.string().trim().min(20).max(20000) });
const summarySchema = textSchema.extend({ sentences: z.number().int().min(1).max(10).default(3) });
const keywordSchema = textSchema.extend({ limit: z.number().int().min(3).max(25).default(8) });
const normalizeSchema = textSchema.extend({ casing: z.enum(['preserve', 'lower', 'upper']).default('preserve') });

const execute = (schema, operation) => (request, response) => {
  const validation = schema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({ message: 'El texto debe contener entre 20 y 20000 caracteres.' });
  }

  const startedAt = performance.now();
  const result = operation(validation.data);

  return response.json({
    result,
    processingMs: Number((performance.now() - startedAt).toFixed(2)),
    engine: 'mia-nlp-local'
  });
};

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '48kb' }));

app.get('/health', (request, response) => {
  response.json({ service: 'ai-service', status: 'ok', engine: 'mia-nlp-local' });
});

app.post('/summarize', execute(summarySchema, ({ text, sentences }) => {
  const summary = summarizeText(text, sentences);
  return {
    summary,
    originalCharacters: text.length,
    summaryCharacters: summary.length,
    reductionPercent: Number(Math.max(0, (1 - summary.length / text.length) * 100).toFixed(1))
  };
}));
app.post('/sentiment', execute(textSchema, ({ text }) => analyzeSentiment(text)));
app.post('/keywords', execute(keywordSchema, ({ text, limit }) => ({ keywords: extractKeywords(text, limit) })));
app.post('/classify', execute(textSchema, ({ text }) => classifyText(text)));
app.post('/statistics', execute(textSchema, ({ text }) => analyzeStatistics(text)));
app.post('/normalize', execute(normalizeSchema, ({ text, casing }) => normalizeText(text, casing)));

app.use((error, request, response, next) => {
  response.status(500).json({ message: 'No fue posible procesar el texto.' });
});

const server = app.listen(port, host, () => {
  console.log(`ai-service activo en http://${host}:${port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
