import { expectType } from 'tsd';
import * as Misskey from '../src';

describe('API', () => {
	test('success', async () => {
		const cli = new Misskey.api.APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN'
		});
		const res = await cli.request('meta', { detail: true });
		expectType<Misskey.entities.InstanceMetadata>(res);
	});

	test('conditional respose type', async () => {
		const cli = new Misskey.api.APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN'
		});

		const res = await cli.request('meta', { detail: true });
		expectType<Misskey.entities.DetailedInstanceMetadata>(res);

		const res2 = await cli.request('meta', { detail: false });
		expectType<Misskey.entities.LiteInstanceMetadata>(res2);

		const res3 = await cli.request('meta', { });
		expectType<Misskey.entities.LiteInstanceMetadata>(res3);
	});
});
