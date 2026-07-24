// Verifica las operaciones principales del motor NLP.
import assert from 'node:assert/strict';
import {
  analyzeSentiment,
  analyzeStatistics,
  classifyText,
  extractKeywords,
  normalizeText,
  summarizeText
} from '../services/ai-service/src/nlp.js';

const text = 'La plataforma de tecnologia utiliza microservicios y datos. El sistema es estable, seguro y eficiente. El equipo mejora el servicio y reduce errores de operacion.';
const summary = summarizeText(text, 2);
const sentiment = analyzeSentiment(text);
const keywords = extractKeywords(text, 5);
const classification = classifyText(text);
const statistics = analyzeStatistics(text);
const normalized = normalizeText('  Texto   con espacios  ,errores.\n\n\nSegunda linea.  ', 'preserve');

assert.ok(summary.length > 20);
assert.equal(sentiment.label, 'positivo');
assert.equal(keywords.length, 5);
assert.equal(classification.category, 'tecnologia');
assert.ok(statistics.words >= 20);
assert.ok(statistics.sentences >= 3);
assert.equal(normalized.text, 'Texto con espacios, errores.\n\nSegunda linea.');

console.log('Pruebas NLP completadas correctamente.');
