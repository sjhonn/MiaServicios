// Verifica las operaciones NLP del backend y navegador.
import { analyzeSentiment, classifyText, extractKeywords, summarizeText } from '../services/ai-service/src/nlp.js';
import { executeLocalAi } from '../frontend/src/services/localAi.js';

const sample = 'La plataforma mejora la calidad del servicio. El sistema procesa datos mediante microservicios seguros. La solucion es estable y eficiente. Los equipos revisan resultados y reducen errores.';

const assertions = [
  summarizeText(sample, 2).length >= 20,
  analyzeSentiment(sample).label === 'positivo',
  extractKeywords(sample, 5).length === 5,
  classifyText(sample).category === 'tecnologia',
  ['summarize', 'sentiment', 'keywords', 'classify'].every((type) => {
    const response = executeLocalAi(type, { text: sample, sentences: 2, limit: 5 });
    return Boolean(response.result) && typeof response.processingMs === 'number';
  })
];

if (assertions.some((assertion) => !assertion)) {
  throw new Error('Fallo la verificacion del motor NLP.');
}

console.log('Verificacion NLP completada correctamente.');
