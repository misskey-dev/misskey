import { locale } from '@/i18n';
import { dialog } from '@/os';
import { store } from '@/store';

export function pleaseLogin() {
	if (store.getters.isSignedIn) return;

	dialog({
		title: locale['signinRequired'],
		text: null
	});

	throw new Error('signin required');
}
