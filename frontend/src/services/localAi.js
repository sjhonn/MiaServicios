// Ejecuta analisis NLP directamente en el navegador.
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

const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const wordsFrom = (text) => normalize(text).match(/[a-z0-9]+/g) || [];
const relevantWords = (text) => wordsFrom(text).filter((word) => word.length > 2 && !stopWords.has(word));
const sentencesFrom = (text) => text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).filter(Boolean);
const frequencyMap = (words) => words.reduce((map, word) => map.set(word, (map.get(word) || 0) + 1), new Map());

const summarize = (text, sentenceLimit = 3) => {
  const sentences = sentencesFrom(text);

  if (sentences.length <= sentenceLimit) {
    return { summary: text.trim(), originalCharacters: text.length };
  }

  const frequencies = frequencyMap(relevantWords(text));
  const maximum = Math.max(...frequencies.values(), 1);
  const normalized = new Map([...frequencies.entries()].map(([word, count]) => [word, count / maximum]));
  const selected = sentences.map((sentence, index) => {
    const words = relevantWords(sentence);
    const density = words.reduce((sum, word) => sum + (normalized.get(word) || 0), 0);
    return { sentence, index, score: density / Math.max(words.length, 1) + (index === 0 ? 0.25 : 0) };
  }).sort((left, right) => right.score - left.score)
    .slice(0, sentenceLimit)
    .sort((left, right) => left.index - right.index)
    .map((item) => item.sentence)
    .join(' ');

  return { summary: selected, originalCharacters: text.length };
};

const sentiment = (text) => {
  const words = wordsFrom(text);
  let score = 0;
  let positiveMatches = 0;
  let negativeMatches = 0;

  words.forEach((word, index) => {
    const multiplier = ['no', 'nunca'].includes(words[index - 1]) ? -1 : 1;

    if (positiveWords.has(word)) {
      score += multiplier;
      multiplier > 0 ? positiveMatches += 1 : negativeMatches += 1;
    }

    if (negativeWords.has(word)) {
      score -= multiplier;
      multiplier > 0 ? negativeMatches += 1 : positiveMatches += 1;
    }
  });

  const matches = positiveMatches + negativeMatches;
  const normalizedScore = matches ? Number((score / matches).toFixed(2)) : 0;

  return {
    label: normalizedScore > 0.2 ? 'positivo' : normalizedScore < -0.2 ? 'negativo' : 'neutral',
    score: normalizedScore,
    positiveMatches,
    negativeMatches
  };
};

const keywords = (text, limit = 8) => ({
  keywords: [...frequencyMap(relevantWords(text)).entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }))
});

const classify = (text) => {
  const words = wordsFrom(text);
  const scores = Object.entries(categoryRules).map(([category, terms]) => ({
    category,
    score: terms.reduce((sum, term) => sum + words.filter((word) => word === term).length, 0)
  })).sort((left, right) => right.score - left.score);
  const winner = scores[0];
  const total = scores.reduce((sum, item) => sum + item.score, 0);

  return winner?.score ? {
    category: winner.category,
    confidence: Number(Math.min(0.98, 0.45 + winner.score / Math.max(total, 1) * 0.5).toFixed(2)),
    scores
  } : { category: 'general', confidence: 0.25, scores };
};

export const executeLocalAi = (type, payload) => {
  const startedAt = performance.now();
  const operations = {
    summarize: () => summarize(payload.text, payload.sentences),
    sentiment: () => sentiment(payload.text),
    keywords: () => keywords(payload.text, payload.limit),
    classify: () => classify(payload.text)
  };

  if (!operations[type]) {
    throw new Error('Operacion no disponible.');
  }

  return {
    result: operations[type](),
    processingMs: Number((performance.now() - startedAt).toFixed(2)),
    engine: 'mia-nlp-browser-1.0'
  };
};
