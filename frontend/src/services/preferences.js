// Guarda y aplica las preferencias visuales del usuario.
const key = 'mia_user_preferences';
const defaults = {
  density: 'comfortable',
  contrast: 'standard',
  motion: 'full',
  textSize: 'standard'
};

const read = () => {
  try {
    return { ...defaults, ...(JSON.parse(localStorage.getItem(key)) || {}) };
  } catch {
    return { ...defaults };
  }
};

const apply = (preferences = read()) => {
  const root = document.documentElement;
  root.dataset.density = preferences.density;
  root.dataset.contrast = preferences.contrast;
  root.dataset.motion = preferences.motion;
  root.dataset.textSize = preferences.textSize;
  return preferences;
};

const save = (preferences) => {
  const normalized = { ...defaults, ...preferences };
  localStorage.setItem(key, JSON.stringify(normalized));
  return apply(normalized);
};

export const preferences = { read, save, apply };
