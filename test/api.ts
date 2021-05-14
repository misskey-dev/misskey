import fetchMock from 'fetch-mock-jest';
import { request } from '../src/api';

describe('API', () => {
	test('success', async () => {
		fetchMock
			.post('https://misskey.test/api/i', (url, options) => {
				if (typeof options.body.i === 'string') {
					return {
						body: {
							id: 'foo'
						}
					};
				}
				return 400;
			});

		const res = await request('https://misskey.test', 'i', {}, 'TOKEN');

		expect(res).toEqual({
			id: 'foo'
		});

		expect(fetchMock).toHaveLastFetched({
			url: 'https://misskey.test/api/i',
			body: { i: 'TOKEN' }
		}, 'post');
	});
});
