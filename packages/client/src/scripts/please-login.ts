import { $i } from '@/account';
import { i18n } from '@/i18n';
import { alert } from '@/os';

export function pleaseLogin() {
	if ($i) return;

	alert({
		title: i18n.locale.signinRequired,
		text: null
	});

	throw new Error('signin required');
}
