import { enableFetchMocks } from 'jest-fetch-mock';
import { APIClient, isAPIError } from '../src/api';

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

		expect(res).toEqual({
			id: 'foo'
		});

		expect(getFetchCall(fetchMock.mock.calls[0])).toEqual({
			url: 'https://misskey.test/api/i',
			method: 'POST',
			body: { i: 'TOKEN' }
		});
	});

	test('with params', async () => {
		fetchMock.resetMocks();
		fetchMock.mockResponse(async (req) => {
			const body = await req.json();
			if (req.method == 'POST' && req.url == 'https://misskey.test/api/notes/show') {
				if (body.i === 'TOKEN' && body.noteId === 'aaaaa') {
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

		const res = await cli.request('notes/show', { noteId: 'aaaaa' });

		expect(res).toEqual({
			id: 'foo'
		});

		expect(getFetchCall(fetchMock.mock.calls[0])).toEqual({
			url: 'https://misskey.test/api/notes/show',
			method: 'POST',
			body: { i: 'TOKEN', noteId: 'aaaaa' }
		});
	});

	test('204 No Content で null が返る', async () => {
		fetchMock.resetMocks();
		fetchMock.mockResponse(async (req) => {
			if (req.method == 'POST' && req.url == 'https://misskey.test/api/reset-password') {
				return { status: 204 };
			} else {
				return { status: 404 };
			}
		});

		const cli = new APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN',
		});

		const res = await cli.request('reset-password', { token: 'aaa', password: 'aaa' });

		expect(res).toEqual(null);

		expect(getFetchCall(fetchMock.mock.calls[0])).toEqual({
			url: 'https://misskey.test/api/reset-password',
			method: 'POST',
			body: { i: 'TOKEN', token: 'aaa', password: 'aaa' }
		});
	});

	test('インスタンスの credential が指定されていても引数で credential が null ならば null としてリクエストされる', async () => {
		fetchMock.resetMocks();
		fetchMock.mockResponse(async (req) => {
			const body = await req.json();
			if (req.method == 'POST' && req.url == 'https://misskey.test/api/i') {
				if (typeof body.i === 'string') {
					return JSON.stringify({ id: 'foo' });
				} else {
					return {
						status: 401,
						body: JSON.stringify({
							error: {
								message: 'Credential required.',
								code: 'CREDENTIAL_REQUIRED',
								id: '1384574d-a912-4b81-8601-c7b1c4085df1',
							}
						})
					};
				}
			} else {
				return { status: 404 };
			}
		});

		try {
			const cli = new APIClient({
				origin: 'https://misskey.test',
				credential: 'TOKEN',
			});

			await cli.request('i', {}, null);
		} catch (e) {
			expect(isAPIError(e)).toEqual(true);
		}
	});

	test('api error', async () => {
		fetchMock.resetMocks();
		fetchMock.mockResponse(async (req) => {
			return {
				status: 500,
				body: JSON.stringify({
					error: {
						message: 'Internal error occurred. Please contact us if the error persists.',
						code: 'INTERNAL_ERROR',
						id: '5d37dbcb-891e-41ca-a3d6-e690c97775ac',
						kind: 'server',
					},
				})
			};
		});

		try {
			const cli = new APIClient({
				origin: 'https://misskey.test',
				credential: 'TOKEN',
			});

			await cli.request('i');
		} catch (e: any) {
			expect(isAPIError(e)).toEqual(true);
			expect(e.id).toEqual('5d37dbcb-891e-41ca-a3d6-e690c97775ac');
		}
	});

	test('network error', async () => {
		fetchMock.resetMocks();
		fetchMock.mockAbort();

		try {
			const cli = new APIClient({
				origin: 'https://misskey.test',
				credential: 'TOKEN',
			});

			await cli.request('i');
		} catch (e) {
			expect(isAPIError(e)).toEqual(false);
		}
	});

	test('json parse error', async () => {
		fetchMock.resetMocks();
		fetchMock.mockResponse(async (req) => {
			return {
				status: 500,
				body: '<html>I AM NOT JSON</html>'
			};
		});

		try {
			const cli = new APIClient({
				origin: 'https://misskey.test',
				credential: 'TOKEN',
			});

			await cli.request('i');
		} catch (e) {
			expect(isAPIError(e)).toEqual(false);
		}
	});
});
