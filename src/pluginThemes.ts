import { Theme } from './theme';

const themes: Theme[] = [];

export function registerTheme(theme: Theme) {
	themes.push(theme);
}

export function getThemes() {
	return themes;
}
