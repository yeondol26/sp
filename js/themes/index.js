// Theme registry. To add a theme: create js/themes/<id>.js (+ optional themes/<id>.css)
// and list it here. The first entry is the default.
import aurora from './aurora.js';
import vinyl from './vinyl.js';
import terminal from './terminal.js';

export const THEMES = [aurora, vinyl, terminal];
export const DEFAULT_THEME = THEMES[0].id;
export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
