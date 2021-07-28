import { $i } from '@client/account';
import { i18n } from '@client/i18n';
import { dialog } from '@client/os';

export function pleaseLogin() {
	if ($i) return;

	dialog({
		title: i18n.locale.signinRequired,
		text: null
	});

	throw new Error('signin required');
}
