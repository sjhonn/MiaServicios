// Expone operaciones NLP sin dependencias de pago.
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { analyzeSentiment, classifyText, extractKeywords, summarizeText } from './nlp.js';

const app = express();
const port = Number(process.env.PORT || 4002);

const textSchema = z.object({
  text: z.string().trim().min(20).max(12000)
});

const summarySchema = textSchema.extend({
  sentences: z.number().int().min(1).max(8).default(3)
});

const keywordSchema = textSchema.extend({
  limit: z.number().int().min(3).max(20).default(8)
});

const execute = (schema, operation) => (request, response) => {
  const validation = schema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({ message: 'El texto debe contener entre 20 y 12000 caracteres.' });
  }

  const startedAt = performance.now();
  const result = operation(validation.data);

  return response.json({
    result,
    processingMs: Number((performance.now() - startedAt).toFixed(2)),
    engine: 'mia-nlp-local-1.0'
  });
};

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '32kb' }));

app.get('/health', (request, response) => {
  response.json({ service: 'ai-service', status: 'ok', engine: 'mia-nlp-local-1.0' });
});

app.post('/summarize', execute(summarySchema, ({ text, sentences }) => ({
  summary: summarizeText(text, sentences),
  originalCharacters: text.length
})));

app.post('/sentiment', execute(textSchema, ({ text }) => analyzeSentiment(text)));

app.post('/keywords', execute(keywordSchema, ({ text, limit }) => ({ keywords: extractKeywords(text, limit) })));

app.post('/classify', execute(textSchema, ({ text }) => classifyText(text)));

app.use((error, request, response, next) => {
  response.status(500).json({ message: 'No fue posible procesar el texto.' });
});

app.listen(port, () => {
  console.log(`ai-service activo en http://localhost:${port}`);
});
