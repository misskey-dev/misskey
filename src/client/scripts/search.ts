import { faHistory } from '@fortawesome/free-solid-svg-icons';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { router } from '@/router';

export async function search() {
	const { canceled, result: query } = await os.dialog({
		title: i18n.locale.search,
		input: true
	});
	if (canceled || query == null || query === '') return;

	const q = query.trim();

	if (q.startsWith('@') && !q.includes(' ')) {
		router.push(`/${q}`);
		return;
	}

	if (q.startsWith('#')) {
		router.push(`/tags/${encodeURIComponent(q.substr(1))}`);
		return;
	}

	// like 2018/03/12
	if (/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}/.test(q.replace(/-/g, '/'))) {
		const date = new Date(q.replace(/-/g, '/'));

		// 日付しか指定されてない場合、例えば 2018/03/12 ならユーザーは
		// 2018/03/12 のコンテンツを「含む」結果になることを期待するはずなので
		// 23時間59分進める(そのままだと 2018/03/12 00:00:00 「まで」の
		// 結果になってしまい、2018/03/12 のコンテンツは含まれない)
		if (q.replace(/-/g, '/').match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
			date.setHours(23, 59, 59, 999);
		}

		// TODO
		//v.$root.$emit('warp', date);
		os.dialog({
			icon: faHistory,
			iconOnly: true, autoClose: true
		});
		return;
	}

	if (q.startsWith('https://')) {
		const promise = os.api('ap/show', {
			uri: q
		});

		os.promiseDialog(promise, null, null, i18n.locale.fetchingAsApObject);

		const res = await promise;

		if (res.type === 'User') {
			router.push(`/@${res.object.username}@${res.object.host}`);
		} else if (res.type === 'Note') {
			router.push(`/notes/${res.object.id}`);
		}

		return;
	}

	router.push(`/search?q=${encodeURIComponent(q)}`);
}
