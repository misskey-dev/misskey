import * as os from '@/os';
import { i18n } from '@/i18n';
import { mainRouter } from '@/router';

export async function search() {
	const { canceled, result: query } = await os.inputText({
		title: i18n.ts.search,
	});
	if (canceled || query == null || query === '') return;

	const q = query.trim();

	if (q.startsWith('@') && !q.includes(' ')) {
		mainRouter.push(`/${q}`);
		return;
	}

	if (q.startsWith('#')) {
		mainRouter.push(`/tags/${encodeURIComponent(q.substr(1))}`);
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
		os.alert({
			icon: 'ti ti-history',
			iconOnly: true, autoClose: true,
		});
		return;
	}

	if (q.startsWith('https://')) {
		const promise = os.api('ap/show', {
			uri: q,
		});

		os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);

		const res = await promise;

		if (res.type === 'User') {
			mainRouter.push(`/@${res.object.username}@${res.object.host}`);
		} else if (res.type === 'Note') {
			mainRouter.push(`/notes/${res.object.id}`);
		}

		return;
	}

	mainRouter.push(`/search?q=${encodeURIComponent(q)}`);
}
