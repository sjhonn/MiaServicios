// Centraliza formatos de fecha, numero y archivos.
export const operationLabels = {
  summarize: 'Resumen',
  sentiment: 'Sentimiento',
  keywords: 'Palabras clave',
  classify: 'Clasificacion',
  statistics: 'Estadisticas',
  normalize: 'Normalizacion'
};

export const formatDate = (value, style = 'medium') => value
  ? new Intl.DateTimeFormat('es-PE', { dateStyle: style, timeStyle: 'short' }).format(new Date(value))
  : 'Sin actividad';

export const formatNumber = (value) => new Intl.NumberFormat('es-PE').format(Number(value || 0));

export const resultToText = (item) => {
  const result = item.result || {};
  if (item.type === 'summarize') return result.summary || '';
  if (item.type === 'sentiment') return `${result.label || 'neutral'} (${result.score ?? 0})`;
  if (item.type === 'keywords') return (result.keywords || []).map((entry) => `${entry.word} (${entry.count})`).join(', ');
  if (item.type === 'classify') return `${String(result.category || 'general').replace('_', ' ')} (${Math.round((result.confidence || 0) * 100)}%)`;
  if (item.type === 'statistics') return `${result.words || 0} palabras, ${result.sentences || 0} oraciones, ${result.paragraphs || 0} parrafos`;
  if (item.type === 'normalize') return result.text || '';
  return JSON.stringify(result);
};

export const downloadFile = (filename, content, type = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
