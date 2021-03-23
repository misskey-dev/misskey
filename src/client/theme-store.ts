import { api } from '@client/os';
import { $i } from '@client/account';
import { ColdDeviceStorage } from './store';
import { Theme } from './scripts/theme';

const lsCacheKey = $i ? `themes:${$i.id}` : '';

export function getThemes(): Theme[] {
	return JSON.parse(localStorage.getItem(lsCacheKey) || '[]');
}

export async function fetchThemes(): Promise<void> {
	if ($i == null) return;

	try {
		const themes = await api('i/registry/get', { scope: ['client'], key: 'themes' });
		localStorage.setItem(lsCacheKey, JSON.stringify(themes));
	} catch (e) {
		if (e.code === 'NO_SUCH_KEY') return;
		throw e;
	}
}

export async function addTheme(theme: Theme): Promise<void> {
	await fetchThemes();
	const themes = getThemes().concat(theme);
	await api('i/registry/set', { scope: ['client'], key: 'themes', value: themes });
	localStorage.setItem(lsCacheKey, JSON.stringify(themes));
}

export async function removeTheme(theme: Theme): Promise<void> {
	const themes = getThemes().filter(t => t.id != theme.id);
	await api('i/registry/set', { scope: ['client'], key: 'themes', value: themes });
	localStorage.setItem(lsCacheKey, JSON.stringify(themes));
}
