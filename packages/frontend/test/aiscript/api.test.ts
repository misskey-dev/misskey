/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { miLocalStorage } from '@/local-storage.js';
import * as os from '@/os.js';
import { aiScriptReadline, createAiScriptEnv } from '@/scripts/aiscript/api.js';
import * as misskeyApi from '@/scripts/misskey-api.js';
import { errors, Interpreter, Parser, values } from '@syuilo/aiscript';
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
	vi
} from 'vitest';

async function exe(script: string): Promise<values.Value[]> {
	const outputs: values.Value[] = [];
	const interpreter = new Interpreter(
		createAiScriptEnv({ storageKey: 'widget' }),
		{
			in: aiScriptReadline,
			out: (value) => {
				outputs.push(value);
			}
		}
	);
	const ast = Parser.parse(script);
	await interpreter.exec(ast);
	return outputs;
}

let accountMock = vi.hoisted<Partial<typeof import('@/account.js').$i> | null >(
	() => null
);

vi.mock('@/account.js', () => {
	return {
		get $i() {
			return accountMock;
		},
	};
});

describe('AiScript common API', () => {
	afterAll(() => {
		vi.unstubAllGlobals();
	});

	describe('readline', () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		test.sequential('ok', async () => {
			vi.spyOn(os, 'inputText').mockImplementationOnce(async ({ title }) => {
				expect(title).toBe('question');
				return {
					canceled: false,
					result: 'Hello',
				};
			});
			const [res] = await exe(`
				<: readline('question')
			`);
			expect(res).toStrictEqual(values.STR('Hello'));
		});

		test.sequential('cancelled', async () => {
			vi.spyOn(os, 'inputText').mockImplementationOnce(async ({ title }) => {
				expect(title).toBe('question');
				return {
					canceled: true,
					result: undefined,
				};
			});
			const [res] = await exe(`
				<: readline('question')
			`);
			expect(res).toStrictEqual(values.STR(''));
		});
	});

	describe('user constants', () => {
		describe.sequential('logged in', () => {
			beforeAll(() => {
				accountMock = {
					id: 'xxxxxxxx',
					name: '藍',
					username: 'ai',
				};
			});

			test.sequential('USER_ID', async () => {
				const [res] = await exe(`
					<: USER_ID
				`);
				expect(res).toStrictEqual(values.STR('xxxxxxxx'));
			});

			test.sequential('USER_NAME', async () => {
				const [res] = await exe(`
					<: USER_NAME
				`);
				expect(res).toStrictEqual(values.STR('藍'));
			});

			test.sequential('USER_USERNAME', async () => {
				const [res] = await exe(`
					<: USER_USERNAME
				`);
				expect(res).toStrictEqual(values.STR('ai'));
			});
		});

		describe.sequential('not logged in', () => {
			beforeAll(() => {
				accountMock = null;
			});

			test.sequential('USER_ID', async () => {
				const [res] = await exe(`
					<: USER_ID
				`);
				expect(res).toStrictEqual(values.NULL);
			});

			test.sequential('USER_NAME', async () => {
				const [res] = await exe(`
					<: USER_NAME
				`);
				expect(res).toStrictEqual(values.NULL);
			});

			test.sequential('USER_USERNAME', async () => {
				const [res] = await exe(`
					<: USER_USERNAME
				`);
				expect(res).toStrictEqual(values.NULL);
			});
		});
	});

	describe('dialog', () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		test.sequential('ok', async () => {
			const alertMock = vi.spyOn(os, 'alert')
				.mockImplementationOnce(async ({ type, title, text }) => {
					expect(type).toBe('success');
					expect(title).toBe('Hello');
					expect(text).toBe('world');
				});
			const [res] = await exe(`
				<: Mk:dialog('Hello', 'world', 'success')
			`);
			expect(res).toStrictEqual(values.NULL);
			expect(alertMock).toHaveBeenCalledOnce();
		});

		test.sequential('omit type', async () => {
			const alertMock = vi.spyOn(os, 'alert')
				.mockImplementationOnce(async ({ type, title, text }) => {
					expect(type).toBe('info');
					expect(title).toBe('Hello');
					expect(text).toBe('world');
				});
			const [res] = await exe(`
				<: Mk:dialog('Hello', 'world')
			`);
			expect(res).toStrictEqual(values.NULL);
			expect(alertMock).toHaveBeenCalledOnce();
		});

		test.sequential('invalid type', async () => {
			const alertMock = vi.spyOn(os, 'alert');
			await expect(() => exe(`
				<: Mk:dialog('Hello', 'world', 'invalid')
			`)).rejects.toBeInstanceOf(errors.AiScriptRuntimeError);
			expect(alertMock).not.toHaveBeenCalled();
		});
	});

	describe('confirm', () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		test.sequential('ok', async () => {
			const confirmMock = vi.spyOn(os, 'confirm')
				.mockImplementationOnce(async ({ type, title, text }) => {
					expect(type).toBe('success');
					expect(title).toBe('Hello');
					expect(text).toBe('world');
					return { canceled: false };
				});
			const [res] = await exe(`
				<: Mk:confirm('Hello', 'world', 'success')
			`);
			expect(res).toStrictEqual(values.TRUE);
			expect(confirmMock).toHaveBeenCalledOnce();
		});

		test.sequential('omit type', async () => {
			const confirmMock = vi.spyOn(os, 'confirm')
				.mockImplementationOnce(async ({ type, title, text }) => {
					expect(type).toBe('question');
					expect(title).toBe('Hello');
					expect(text).toBe('world');
					return { canceled: false };
				});
			const [res] = await exe(`
				<: Mk:confirm('Hello', 'world')
			`);
			expect(res).toStrictEqual(values.TRUE);
			expect(confirmMock).toHaveBeenCalledOnce();
		});

		test.sequential('canceled', async () => {
			const confirmMock = vi.spyOn(os, 'confirm')
				.mockImplementationOnce(async ({ type, title, text }) => {
					expect(type).toBe('question');
					expect(title).toBe('Hello');
					expect(text).toBe('world');
					return { canceled: true };
				});
			const [res] = await exe(`
				<: Mk:confirm('Hello', 'world')
			`);
			expect(res).toStrictEqual(values.FALSE);
			expect(confirmMock).toHaveBeenCalledOnce();
		});

		test.sequential('invalid type', async () => {
			const alertMock = vi.spyOn(os, 'confirm');
			await expect(() => exe(`
				<: Mk:confirm('Hello', 'world', 'invalid')
			`)).rejects.toBeInstanceOf(errors.AiScriptRuntimeError);
			expect(alertMock).not.toHaveBeenCalled();
		});
	});

	describe('api', () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		test.sequential('successful', async () => {
			const misskeyApiMock = vi.spyOn(misskeyApi, 'misskeyApiUntyped')
				.mockImplementationOnce(async (endpoint, data, token) => {
					expect(endpoint).toBe('ping');
					expect(data).toStrictEqual({});
					expect(token).toBeNull();
					return { pong: 1735657200000 };
				});
			const [res] = await exe(`
				<: Mk:api('ping', {})
			`);
			expect(res).toStrictEqual(values.OBJ(new Map([
				['pong', values.NUM(1735657200000)],
			])));
			expect(misskeyApiMock).toHaveBeenCalledOnce();
		});

		test.sequential('with token', async () => {
			const misskeyApiMock = vi.spyOn(misskeyApi, 'misskeyApiUntyped')
				.mockImplementationOnce(async (endpoint, data, token) => {
					expect(endpoint).toBe('ping');
					expect(data).toStrictEqual({});
					expect(token).toStrictEqual('xxxxxxxx');
					return { pong: 1735657200000 };
				});
			const [res] = await exe(`
				<: Mk:api('ping', {}, 'xxxxxxxx')
			`);
			expect(res).toStrictEqual(values.OBJ(new Map([
				['pong', values.NUM(1735657200000 )],
			])));
			expect(misskeyApiMock).toHaveBeenCalledOnce();
		});

		test.sequential('request failed', async () => {
			const misskeyApiMock = vi.spyOn(misskeyApi, 'misskeyApiUntyped')
				.mockRejectedValueOnce('Not Found');
			const [res] = await exe(`
				<: Mk:api('this/endpoint/should/not/be/found', {})
			`);
			expect(res).toStrictEqual(
				values.ERROR('request_failed', values.STR('Not Found'))
			);
			expect(misskeyApiMock).toHaveBeenCalledOnce();
		});

		test.sequential('invalid endpoint', async () => {
			const misskeyApiMock = vi.spyOn(misskeyApi, 'misskeyApiUntyped');
			await expect(() => exe(`
				Mk:api('https://example.com/api/ping', {})
			`)).rejects.toStrictEqual(
				new errors.AiScriptRuntimeError('invalid endpoint'),
			);
			expect(misskeyApiMock).not.toHaveBeenCalled();
		});

		test.sequential('missing param', async () => {
			const misskeyApiMock = vi.spyOn(misskeyApi, 'misskeyApiUntyped');
			await expect(() => exe(`
				Mk:api('ping')
			`)).rejects.toStrictEqual(
				new errors.AiScriptRuntimeError('expected param'),
			);
			expect(misskeyApiMock).not.toHaveBeenCalled();
		});
	});

	describe('save and load', () => {
		beforeEach(() => {
			miLocalStorage.removeItem('aiscript:widget:key');
		});

		afterEach(() => {
			miLocalStorage.removeItem('aiscript:widget:key');
		});

		test.sequential('successful', async () => {
			const [res] = await exe(`
				Mk:save('key', 'value')
				<: Mk:load('key')
			`);
			expect(miLocalStorage.getItem('aiscript:widget:key')).toBe('"value"');
			expect(res).toStrictEqual(values.STR('value'));
		});

		test.sequential('missing value to save', async () => {
			await expect(() => exe(`
				Mk:save('key')
			`)).rejects.toStrictEqual(
				new errors.AiScriptRuntimeError('expected value')
			);
		});

		test.sequential('not value found to load', async () => {
			const [res] = await exe(`
				<: Mk:load('key')
			`);
			expect(res).toStrictEqual(values.NULL);
		});
	});

	test.concurrent('url', async () => {
		vi.stubGlobal('location', { href: 'https://example.com/' });
		const [res] = await exe(`
			<: Mk:url()
		`);
		expect(res).toStrictEqual(values.STR('https://example.com/'));
	});

	test.concurrent('nyaize', async () => {
		const [res] = await exe(`
			<: Mk:nyaize('な')
		`);
		expect(res).toStrictEqual(values.STR('にゃ'));
	});
});
