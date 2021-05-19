import { request } from '../src/api';
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
				if (typeof body.i != 'string') {
					return { status: 400 };
				}
				return JSON.stringify({ id: 'foo' });
			} else {
				return { status: 404 };
			}
		});

		const res = await request('https://misskey.test', 'i', {}, 'TOKEN');

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
			await request('https://misskey.test', 'i', {}, 'TOKEN');
		} catch (e) {
			expect(e.id).toEqual('5d37dbcb-891e-41ca-a3d6-e690c97775ac');
		}
	});

	// TODO: ネットワークエラーのテスト
});
