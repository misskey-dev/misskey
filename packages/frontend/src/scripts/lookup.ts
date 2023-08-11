import * as os from '@/os';
import { i18n } from '@/i18n';
import { mainRouter } from '@/router';
import { Router } from '@/nirax';

export async function lookup(router?: Router) {
	const _router = router ?? mainRouter;

	const { canceled, result: query } = await os.inputText({
		title: i18n.ts.lookup,
	});
	if (canceled) return;
	
	if (query.startsWith('@') && !query.includes(' ')) {
		_router.push(`/${query}`);
		return;
	}

	if (query.startsWith('#')) {
		_router.push(`/tags/${encodeURIComponent(query.substr(1))}`);
		return;
	}

	if (query.startsWith('https://')) {
		const promise = os.api('ap/show', {
			uri: query,
		});

		os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);

		const res = await promise;

		if (res.type === 'User') {
			_router.push(`/@${res.object.username}@${res.object.host}`);
		} else if (res.type === 'Note') {
			_router.push(`/notes/${res.object.id}`);
		}

		return;
	}
}
