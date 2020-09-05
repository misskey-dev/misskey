import { faHistory } from '@fortawesome/free-solid-svg-icons';

export async function search(v: any, q: string) {
	q = q.trim();

	if (q.startsWith('@') && !q.includes(' ')) {
		v.$router.push(`/${q}`);
		return;
	}

	if (q.startsWith('#')) {
		v.$router.push(`/tags/${encodeURIComponent(q.substr(1))}`);
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

		v.$root.$emit('warp', date);
		v.$root.showDialog({
			icon: faHistory,
			iconOnly: true, autoClose: true
		});
		return;
	}

	if (q.startsWith('https://')) {
		const dialog = v.$root.showDialog({
			type: 'waiting',
			text: v.$t('fetchingAsApObject') + '...',
			showOkButton: false,
			showCancelButton: false,
			cancelableByBgClick: false
		});

		try {
			const res = await v.$root.api('ap/show', {
				uri: q
			});
			dialog.close();
			if (res.type === 'User') {
				v.$router.push(`/@${res.object.username}@${res.object.host}`);
			} else if (res.type === 'Note') {
				v.$router.push(`/notes/${res.object.id}`);
			}
		} catch (e) {
			dialog.close();
			// TODO: Show error
		}

		return;
	}

	v.$router.push(`/search?q=${encodeURIComponent(q)}`);
}
