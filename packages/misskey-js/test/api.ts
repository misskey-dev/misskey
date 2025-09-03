import { vi, describe, test, expect } from 'vitest';
import { APIClient, isAPIError } from '../src/api.js';

describe('API', () => {
	test('success', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async (url, options) => {
				if (url === 'https://misskey.test/api/i' && options?.method === 'POST') {
					if (options.body) {
						const body = JSON.parse(options.body as string);
						if (body.i === 'TOKEN') {
							return new Response(JSON.stringify({ id: 'foo' }), { status: 200 });
						}
					}

					return new Response(null, { status: 400 });
				}

				return new Response(null, { status: 404 });
			});

		const cli = new APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN',
		});

		const res = await cli.request('i');

		expect(res).toEqual({
			id: 'foo'
		});

		fetch('https://misskey.test/api/i', {
			method: 'POST',
		})

		expect(fetchMock).toHaveBeenCalledWith('https://misskey.test/api/i', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'omit',
			cache: 'no-cache',
			body: JSON.stringify({ i: 'TOKEN' }),
		});

		fetchMock.mockRestore();
	});

	test('with params', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async (url, options) => {
				if (url === 'https://misskey.test/api/notes/show' && options?.method === 'POST') {
					if (options.body) {
						const body = JSON.parse(options.body as string);
						if (body.i === 'TOKEN' && body.noteId === 'aaaaa') {
							return new Response(JSON.stringify({ id: 'foo' }), { status: 200 });
						}
					}
					return new Response(null, { status: 400 });
				}
				return new Response(null, { status: 404 });
			});

		const cli = new APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN',
		});

		const res = await cli.request('notes/show', { noteId: 'aaaaa' });

		expect(res).toEqual({
			id: 'foo'
		});

		expect(fetchMock).toHaveBeenCalledWith('https://misskey.test/api/notes/show', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'omit',
			cache: 'no-cache',
			body: JSON.stringify({ noteId: 'aaaaa', i: 'TOKEN' }),
		});

		fetchMock.mockRestore();
	});

	test('multipart/form-data', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async (url, options) => {
				if (url === 'https://misskey.test/api/drive/files/create' && options?.method === 'POST') {
					if (options.body instanceof FormData) {
						const file = options.body.get('file');
						if (file instanceof File && file.name === 'foo.txt') {
							return new Response(JSON.stringify({ id: 'foo' }), { status: 200 });
						}
					}
					return new Response(null, { status: 400 });
				}
				return new Response(null, { status: 404 });
			});

		const cli = new APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN',
		});

		const testFile = new File([], 'foo.txt');

		const res = await cli.request('drive/files/create', {
			file: testFile,
			name: null, // nullのパラメータは消える
		});

		expect(res).toEqual({
			id: 'foo'
		});

		expect(fetchMock).toHaveBeenCalledWith('https://misskey.test/api/drive/files/create', {
			method: 'POST',
			body: expect.any(FormData),
			headers: {},
			credentials: 'omit',
			cache: 'no-cache',
		});

		fetchMock.mockRestore();
	});

	test('204 No Content で null が返る', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async (url, options) => {
				if (url === 'https://misskey.test/api/reset-password' && options?.method === 'POST') {
					return new Response(null, { status: 204 });
				}
				return new Response(null, { status: 404 });
			});

		const cli = new APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN',
		});

		const res = await cli.request('reset-password', { token: 'aaa', password: 'aaa' });

		expect(res).toEqual(null);

		expect(fetchMock).toHaveBeenCalledWith('https://misskey.test/api/reset-password', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'omit',
			cache: 'no-cache',
			body: JSON.stringify({ token: 'aaa', password: 'aaa', i: 'TOKEN' }),
		});

		fetchMock.mockRestore();
	});

	test('インスタンスの credential が指定されていても引数で credential が null ならば null としてリクエストされる', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async (url, options) => {
				if (url === 'https://misskey.test/api/i' && options?.method === 'POST') {
					if (options.body) {
						const body = JSON.parse(options.body as string);
						if (typeof body.i === 'string') {
							return new Response(JSON.stringify({ id: 'foo' }), { status: 200 });
						} else {
							return new Response(JSON.stringify({
								error: {
									message: 'Credential required.',
									code: 'CREDENTIAL_REQUIRED',
									id: '1384574d-a912-4b81-8601-c7b1c4085df1',
								}
							}), { status: 401 });
						}
					}
					return new Response(null, { status: 400 });
				}
				return new Response(null, { status: 404 });
			});

		try {
			const cli = new APIClient({
				origin: 'https://misskey.test',
				credential: 'TOKEN',
			});

			await cli.request('i', {}, null);
		} catch (e) {
			expect(isAPIError(e)).toEqual(true);
		} finally {
			fetchMock.mockRestore();
		}
	});

	test('api error', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async () => {
				return new Response(JSON.stringify({
					error: {
						message: 'Internal error occurred. Please contact us if the error persists.',
						code: 'INTERNAL_ERROR',
						id: '5d37dbcb-891e-41ca-a3d6-e690c97775ac',
						kind: 'server',
					},
				}), { status: 500 });
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
		} finally {
			fetchMock.mockRestore();
		}
	});

	test('network error', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async () => {
				throw new Error('Network error');
			});

		try {
			const cli = new APIClient({
				origin: 'https://misskey.test',
				credential: 'TOKEN',
			});

			await cli.request('i');
		} catch (e) {
			expect(isAPIError(e)).toEqual(false);
		} finally {
			fetchMock.mockRestore();
		}
	});

	test('json parse error', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async () => {
				return new Response('<html>I AM NOT JSON</html>', { status: 500 });
			});

		try {
			const cli = new APIClient({
				origin: 'https://misskey.test',
				credential: 'TOKEN',
			});

			await cli.request('i');
		} catch (e) {
			expect(isAPIError(e)).toEqual(false);
		} finally {
			fetchMock.mockRestore();
		}
	});

	test('admin/roles/create の型が合う', async() => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockImplementation(async () => {
				// 本来返すべき値は`Role`型だが、テストなのでお茶を濁す
				return new Response('{}', { status: 200 });
			});

		const cli = new APIClient({
			origin: 'https://misskey.test',
			credential: 'TOKEN',
		});
		await cli.request('admin/roles/create', {
			name: 'aaa',
			asBadge: false,
			canEditMembersByModerator: false,
			color: '#123456',
			condFormula: {},
			description: '',
			displayOrder: 0,
			iconUrl: '',
			isAdministrator: false,
			isExplorable: false,
			isModerator: false,
			isPublic: false,
			policies: {
				ltlAvailable: {
					value: true,
					priority: 0,
					useDefault: false,
				},
			},
			target: 'manual',
		});

		fetchMock.mockRestore();
	})
});
