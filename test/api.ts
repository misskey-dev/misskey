import { APIClient } from '../src/api';
import { enableFetchMocks } from 'jest-fetch-mock';

enableFetchMocks();

function getFetchCall(call: any[]) {
	const { body, method } = call[1];
	if (body != null && typeof body != 'string') {
		throw new Error('invalid body');
	}
	return {
		url: call[0],
		method: method,
		body: JSON.parse(body as any)
	};
}

describe('API', () => {
	test('success', async () => {
		fetchMock.resetMocks();
		fetchMock.mockResponse(async (req) => {
			const body = await req.json();
			if (req.method == 'POST' && req.url == 'https://misskey.test/api/i') {
				if (body.i === 'TOKEN') {
					return JSON.stringify({ id: 'foo' });
				} else {
					return { status: 400 };
				}
			} else {
				return { status: 404 };
			}
		});

		const cli = new APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN',
		});

		const res = await cli.request('i');

		// validate response
		expect(res).toEqual({
			id: 'foo'
		});

		// validate fetch call
		expect(getFetchCall(fetchMock.mock.calls[0])).toEqual({
			url: 'https://misskey.test/api/i',
			method: 'POST',
			body: { i: 'TOKEN' }
		});
	});

	test('error', async () => {
		fetchMock.resetMocks();
		fetchMock.mockResponse(async (req) => {
			return {
				status: 500,
				body: JSON.stringify({
					message: 'Internal error occurred. Please contact us if the error persists.',
					code: 'INTERNAL_ERROR',
					id: '5d37dbcb-891e-41ca-a3d6-e690c97775ac',
					kind: 'server',
				})
			};
		});

		try {
			const cli = new APIClient({
				origin: 'https://misskey.test',
				credential: 'TOKEN',
			});
	
			await cli.request('i');
		} catch (e) {
			expect(e.id).toEqual('5d37dbcb-891e-41ca-a3d6-e690c97775ac');
		}
	});

	// TODO: ネットワークエラーのテスト

	// TODO: JSON以外が返ってきた場合のハンドリング
});
