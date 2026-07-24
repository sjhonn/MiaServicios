// Implementa utilidades locales de procesamiento de lenguaje.
const stopWords = new Set([
  'a', 'al', 'algo', 'algunas', 'algunos', 'ante', 'antes', 'como', 'con', 'contra', 'cual', 'cuando',
  'de', 'del', 'desde', 'donde', 'dos', 'el', 'ella', 'ellas', 'ellos', 'en', 'entre', 'era', 'es',
  'esa', 'esas', 'ese', 'eso', 'esos', 'esta', 'estaba', 'estado', 'estas', 'este', 'esto', 'estos',
  'fue', 'ha', 'hacia', 'han', 'hasta', 'hay', 'la', 'las', 'le', 'les', 'lo', 'los', 'mas', 'me',
  'mi', 'mis', 'mucho', 'muy', 'no', 'nos', 'o', 'otra', 'otro', 'para', 'pero', 'por', 'porque',
  'que', 'se', 'sin', 'sobre', 'su', 'sus', 'tambien', 'te', 'tiene', 'todo', 'un', 'una', 'uno',
  'unos', 'y', 'ya'
]);

const positiveWords = new Set([
  'acierto', 'avance', 'beneficio', 'bien', 'calidad', 'claro', 'confiable', 'correcto', 'crecimiento',
  'eficiente', 'estable', 'excelente', 'exito', 'favorable', 'feliz', 'ganancia', 'mejora', 'mejor',
  'positivo', 'rapido', 'seguro', 'solucion', 'satisfaccion', 'util', 'valor'
]);

const negativeWords = new Set([
  'alarma', 'caida', 'critico', 'demora', 'defecto', 'error', 'falla', 'fracaso', 'inseguro', 'lento',
  'malo', 'negativo', 'perdida', 'problema', 'rechazo', 'riesgo', 'roto', 'vulnerable', 'incidente',
  'queja', 'deficiente', 'costoso', 'bloqueo', 'inestable', 'grave'
]);

const categoryRules = {
  tecnologia: ['api', 'aplicacion', 'codigo', 'datos', 'digital', 'microservicio', 'nube', 'software', 'sistema', 'tecnologia'],
  finanzas: ['banco', 'costo', 'credito', 'dinero', 'factura', 'finanzas', 'ganancia', 'inversion', 'pago', 'presupuesto'],
  operaciones: ['calidad', 'cliente', 'entrega', 'inventario', 'logistica', 'operacion', 'proceso', 'produccion', 'servicio', 'transporte'],
  seguridad: ['acceso', 'amenaza', 'auditoria', 'cifrado', 'incidente', 'riesgo', 'seguridad', 'vulnerabilidad', 'token', 'fraude'],
  recursos_humanos: ['capacitacion', 'colaborador', 'desempeno', 'empleado', 'equipo', 'liderazgo', 'persona', 'personal', 'talento', 'trabajador']
};

const normalize = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const wordsFrom = (text) => normalize(text).match(/[a-z0-9]+/g) || [];

const relevantWords = (text) => wordsFrom(text).filter((word) => word.length > 2 && !stopWords.has(word));

const sentencesFrom = (text) => text
  .replace(/\s+/g, ' ')
  .trim()
  .split(/(?<=[.!?])\s+/)
  .filter(Boolean);

const frequencyMap = (words) => words.reduce((map, word) => {
  map.set(word, (map.get(word) || 0) + 1);
  return map;
}, new Map());

export const summarizeText = (text, sentenceLimit = 3) => {
  const sentences = sentencesFrom(text);

  if (sentences.length <= sentenceLimit) {
    return text.trim();
  }

  const frequencies = frequencyMap(relevantWords(text));
  const maximum = Math.max(...frequencies.values(), 1);
  const normalizedFrequencies = new Map(
    [...frequencies.entries()].map(([word, count]) => [word, count / maximum])
  );

  const scored = sentences.map((sentence, index) => {
    const words = relevantWords(sentence);
    const density = words.reduce((total, word) => total + (normalizedFrequencies.get(word) || 0), 0);
    const positionBoost = index === 0 ? 0.25 : index === sentences.length - 1 ? 0.1 : 0;
    return { index, sentence, score: density / Math.max(words.length, 1) + positionBoost };
  });

  return scored
    .sort((left, right) => right.score - left.score)
    .slice(0, sentenceLimit)
    .sort((left, right) => left.index - right.index)
    .map((item) => item.sentence)
    .join(' ');
};

export const analyzeSentiment = (text) => {
  const words = wordsFrom(text);
  let score = 0;
  let positive = 0;
  let negative = 0;

  words.forEach((word, index) => {
    const previous = words[index - 1];
    const multiplier = previous === 'no' || previous === 'nunca' ? -1 : 1;

    if (positiveWords.has(word)) {
      score += multiplier;
      positive += multiplier > 0 ? 1 : 0;
      negative += multiplier < 0 ? 1 : 0;
    }

    if (negativeWords.has(word)) {
      score -= multiplier;
      negative += multiplier > 0 ? 1 : 0;
      positive += multiplier < 0 ? 1 : 0;
    }
  });

  const matches = positive + negative;
  const normalizedScore = matches ? Number((score / matches).toFixed(2)) : 0;
  const label = normalizedScore > 0.2 ? 'positivo' : normalizedScore < -0.2 ? 'negativo' : 'neutral';

  return { label, score: normalizedScore, positiveMatches: positive, negativeMatches: negative };
};

export const extractKeywords = (text, limit = 8) => {
  const frequencies = frequencyMap(relevantWords(text));

  return [...frequencies.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
};

export const classifyText = (text) => {
  const words = wordsFrom(text);
  const scores = Object.entries(categoryRules).map(([category, terms]) => {
    const score = terms.reduce((total, term) => total + words.filter((word) => word === term).length, 0);
    return { category, score };
  }).sort((left, right) => right.score - left.score);

  const winner = scores[0];
  const total = scores.reduce((sum, item) => sum + item.score, 0);

  if (!winner || winner.score === 0) {
    return { category: 'general', confidence: 0.25, scores };
  }

  return {
    category: winner.category,
    confidence: Number(Math.min(0.98, 0.45 + winner.score / Math.max(total, 1) * 0.5).toFixed(2)),
    scores
  };
};
