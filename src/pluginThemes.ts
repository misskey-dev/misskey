const themes: any[] = [];

export function registerTheme(theme: any) {
	themes.push(theme);
}

export function getThemes() {
	return themes;
}
