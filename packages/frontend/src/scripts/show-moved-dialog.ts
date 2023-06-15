import * as os from '@/os';
import { $i } from '@/account';
import { i18n } from '@/i18n';

export function showMovedDialog() {
	if (!$i) return;
	if (!$i.movedTo) return;

	os.alert({
		type: 'error',
		title: i18n.ts.accountMovedShort,
		text: i18n.ts.operationForbidden,
	});

	throw new Error('account moved');
}
