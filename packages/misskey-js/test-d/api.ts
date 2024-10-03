import { expectType } from 'tsd';
import * as Misskey from '../src/index.js';

describe('API', () => {
	test('success', async () => {
		const cli = new Misskey.api.APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN'
		});
		const res = await cli.request('meta', { detail: true });
		expectType<Misskey.entities.MetaResponse>(res);
	});

	test('conditional response type (meta)', async () => {
		const cli = new Misskey.api.APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN'
		});

		const res = await cli.request('meta', { detail: true });
		expectType<Misskey.entities.MetaResponse>(res);

		const res2 = await cli.request('meta', { detail: false });
		expectType<Misskey.entities.MetaResponse>(res2);

		const res3 = await cli.request('meta', { });
		expectType<Misskey.entities.MetaResponse>(res3);

		const res4 = await cli.request('meta', { detail: true as boolean });
		expectType<Misskey.entities.MetaResponse>(res4);
	});

	test('conditional response type (users/show)', async () => {
		const cli = new Misskey.api.APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN'
		});

		const res = await cli.request('users/show', { userId: 'xxxxxxxx' });
		expectType<Misskey.entities.UserDetailed>(res);

		const res2 = await cli.request('users/show', { userIds: ['xxxxxxxx'] });
		expectType<Misskey.entities.UserDetailed[]>(res2);
	});
});
