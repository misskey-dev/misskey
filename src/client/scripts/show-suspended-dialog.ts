import * as os from '@client/os';
import { i18n } from '@client/i18n';

export function showSuspendedDialog() {
	return os.dialog({
		type: 'error',
		title: i18n.locale.yourAccountSuspendedTitle,
		text: i18n.locale.yourAccountSuspendedDescription
	});
}
