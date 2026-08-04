// Implementa operaciones locales de procesamiento de lenguaje.
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
  'positivo', 'rapido', 'seguro', 'solucion', 'satisfaccion', 'util', 'valor', 'optimizado', 'disponible'
]);

const negativeWords = new Set([
  'alarma', 'caida', 'critico', 'demora', 'defecto', 'error', 'falla', 'fracaso', 'inseguro', 'lento',
  'malo', 'negativo', 'perdida', 'problema', 'rechazo', 'riesgo', 'roto', 'vulnerable', 'incidente',
  'queja', 'deficiente', 'costoso', 'bloqueo', 'inestable', 'grave', 'indisponible', 'degradado'
]);

const categoryRules = {
  tecnologia: ['api', 'aplicacion', 'codigo', 'datos', 'digital', 'microservicio', 'nube', 'software', 'sistema', 'tecnologia', 'servidor', 'frontend', 'backend'],
  finanzas: ['banco', 'costo', 'credito', 'dinero', 'factura', 'finanzas', 'ganancia', 'inversion', 'pago', 'presupuesto', 'contable', 'ingreso'],
  operaciones: ['calidad', 'cliente', 'entrega', 'inventario', 'logistica', 'operacion', 'proceso', 'produccion', 'servicio', 'transporte', 'almacen', 'distribucion'],
  seguridad: ['acceso', 'amenaza', 'auditoria', 'cifrado', 'incidente', 'riesgo', 'seguridad', 'vulnerabilidad', 'token', 'fraude', 'autenticacion', 'permiso'],
  recursos_humanos: ['capacitacion', 'colaborador', 'desempeno', 'empleado', 'equipo', 'liderazgo', 'persona', 'personal', 'talento', 'trabajador', 'seleccion', 'contratacion']
};

const normalizeForAnalysis = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const wordsFrom = (text) => normalizeForAnalysis(text).match(/[a-z0-9]+/g) || [];
const relevantWords = (text) => wordsFrom(text).filter((word) => word.length > 2 && !stopWords.has(word));
const sentencesFrom = (text) => text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).filter(Boolean);
const paragraphsFrom = (text) => text.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
const frequencyMap = (words) => words.reduce((map, word) => map.set(word, (map.get(word) || 0) + 1), new Map());

export const summarizeText = (text, sentenceLimit = 3) => {
  const sentences = sentencesFrom(text);

  if (sentences.length <= sentenceLimit) {
    return text.trim();
  }

  const frequencies = frequencyMap(relevantWords(text));
  const maximum = Math.max(...frequencies.values(), 1);
  const normalized = new Map([...frequencies.entries()].map(([word, count]) => [word, count / maximum]));

  return sentences
    .map((sentence, index) => {
      const words = relevantWords(sentence);
      const density = words.reduce((sum, word) => sum + (normalized.get(word) || 0), 0);
      const positionBoost = index === 0 ? 0.25 : index === sentences.length - 1 ? 0.1 : 0;
      return { sentence, index, score: density / Math.max(words.length, 1) + positionBoost };
    })
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
    const multiplier = ['no', 'nunca', 'jamas'].includes(words[index - 1]) ? -1 : 1;

    if (positiveWords.has(word)) {
      score += multiplier;
      multiplier > 0 ? positive += 1 : negative += 1;
    }

    if (negativeWords.has(word)) {
      score -= multiplier;
      multiplier > 0 ? negative += 1 : positive += 1;
    }
  });

  const matches = positive + negative;
  const normalizedScore = matches ? Number((score / matches).toFixed(2)) : 0;

  return {
    label: normalizedScore > 0.2 ? 'positivo' : normalizedScore < -0.2 ? 'negativo' : 'neutral',
    score: normalizedScore,
    positiveMatches: positive,
    negativeMatches: negative
  };
};

export const extractKeywords = (text, limit = 8) => [...frequencyMap(relevantWords(text)).entries()]
  .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
  .slice(0, limit)
  .map(([word, count]) => ({ word, count }));

export const classifyText = (text) => {
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

export const analyzeStatistics = (text) => {
  const words = wordsFrom(text);
  const relevant = relevantWords(text);
  const unique = new Set(relevant);
  const sentences = sentencesFrom(text);
  const paragraphs = paragraphsFrom(text);
  const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);

  return {
    characters: text.length,
    charactersWithoutSpaces: text.replace(/\s/g, '').length,
    words: words.length,
    uniqueWords: unique.size,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    averageWordLength: words.length ? Number((totalWordLength / words.length).toFixed(2)) : 0,
    lexicalDensity: words.length ? Number((relevant.length / words.length).toFixed(2)) : 0,
    estimatedReadingMinutes: Number(Math.max(words.length / 200, 0.01).toFixed(2))
  };
};

export const normalizeText = (text, casing = 'preserve') => {
  let normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,.;:!?])(?=[A-Za-z0-9])/g, '$1 ')
    .trim();

  if (casing === 'lower') normalized = normalized.toLowerCase();
  if (casing === 'upper') normalized = normalized.toUpperCase();

  return {
    text: normalized,
    originalCharacters: text.length,
    normalizedCharacters: normalized.length,
    removedCharacters: Math.max(text.length - normalized.length, 0)
  };
};
