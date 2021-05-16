import { expectType } from 'tsd';
import * as Misskey from '../src';

describe('API', () => {
	describe('request', () => {
		test('success', async () => {
			const res = await Misskey.api.request('https://misskey.test', 'meta', { detail: true }, 'TOKEN');
			expectType<Misskey.entities.InstanceMetadata>(res);
		});
	});

	describe('APIClient', () => {
		test('success', async () => {
			const cli = new Misskey.api.APIClient({
				origin: 'https://misskey.test'
			});
			cli.i = { token: 'TOKEN' };
			const res = await cli.request('meta', { detail: true });
			expectType<Misskey.entities.InstanceMetadata>(res);
		});
	});
});
