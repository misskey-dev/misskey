import parseAcct from '@/misc/acct/parse';
import { i18n } from '@client/i18n';
import * as os from '@client/os';

export async function lookupUser() {
	const { canceled, result } = await os.dialog({
		title: i18n.locale.usernameOrUserId,
		input: true
	});
	if (canceled) return;

	const show = (user) => {
		os.pageWindow(`/instance/user/${user.id}`);
	};

	const usernamePromise = os.api('users/show', parseAcct(result));
	const idPromise = os.api('users/show', { userId: result });
	let _notFound = false;
	const notFound = () => {
		if (_notFound) {
			os.dialog({
				type: 'error',
				text: i18n.locale.noSuchUser
			});
		} else {
			_notFound = true;
		}
	};
	usernamePromise.then(show).catch(e => {
		if (e.code === 'NO_SUCH_USER') {
			notFound();
		}
	});
	idPromise.then(show).catch(e => {
		notFound();
	});
}
