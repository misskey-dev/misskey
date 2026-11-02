/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { miLocalStorage } from '@/local-storage.js';
import { aiScriptReadline, createAiScriptEnv } from '@/aiscript/api.js';
import { errors, Interpreter, Parser, values } from '@syuilo/aiscript';
import {
	afterAll,
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

let $iMock = vi.hoisted<Partial<typeof import('@/i.js').$i> | null >(
	() => null
);

function errorWithPos<T extends errors.AiScriptError>(
	error: T,
	line: number,
	column: number,
): T {
	const pos = { line, column };
	error.pos = pos;
	error.message = error.message + `\n  at <root> (Line ${pos.line}, Column ${pos.column})`;
	return error;
}

vi.mock('@/i.js', () => {
	return {
		get $i() {
			return $iMock;
		},
	};
});

const osMock = vi.hoisted(() => {
	return {
		inputText: vi.fn(),
		alert: vi.fn(),
		confirm: vi.fn(),
	};
});

vi.mock('@/os.js', () => {
	return osMock;
});

const misskeyApiMock = vi.hoisted(() => vi.fn());

vi.mock('@/utility/misskey-api.js', () => {
	return { misskeyApi: misskeyApiMock };
});

describe('AiScript common API', () => {
	afterAll(() => {
		vi.unstubAllGlobals();
	});

	describe('readline', () => {
		beforeEach(() => {
			vi.restoreAllMocks();
			vi.clearAllMocks();
		});

		test('ok', { concurrent: false }, async () => {
			osMock.inputText.mockImplementationOnce(async ({ title }) => {
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
			expect(osMock.inputText).toHaveBeenCalledOnce();
		});

		test('cancelled', { concurrent: false }, async () => {
			osMock.inputText.mockImplementationOnce(async ({ title }) => {
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
			expect(osMock.inputText).toHaveBeenCalledOnce();
		});
	});

	describe('user constants', () => {
		describe('logged in', { concurrent: false }, () => {
			beforeAll(() => {
				$iMock = {
					id: 'xxxxxxxx',
					name: '藍',
					username: 'ai',
				};
			});

			test.concurrent('USER_ID', async () => {
				const [res] = await exe(`
					<: USER_ID
				`);
				expect(res).toStrictEqual(values.STR('xxxxxxxx'));
			});

			test.concurrent('USER_NAME', async () => {
				const [res] = await exe(`
					<: USER_NAME
				`);
				expect(res).toStrictEqual(values.STR('藍'));
			});

			test.concurrent('USER_USERNAME', async () => {
				const [res] = await exe(`
					<: USER_USERNAME
				`);
				expect(res).toStrictEqual(values.STR('ai'));
			});
		});

		describe('not logged in', { concurrent: false }, () => {
			beforeAll(() => {
				$iMock = null;
			});

			test.concurrent('USER_ID', async () => {
				const [res] = await exe(`
					<: USER_ID
				`);
				expect(res).toStrictEqual(values.NULL);
			});

			test.concurrent('USER_NAME', async () => {
				const [res] = await exe(`
					<: USER_NAME
				`);
				expect(res).toStrictEqual(values.NULL);
			});

			test.concurrent('USER_USERNAME', async () => {
				const [res] = await exe(`
					<: USER_USERNAME
				`);
				expect(res).toStrictEqual(values.NULL);
			});
		});
	});

	describe('dialog', () => {
		beforeEach(() => {
			vi.restoreAllMocks();
			vi.clearAllMocks();
		});

		test('ok', { concurrent: false }, async () => {
			osMock.alert.mockImplementationOnce(async ({ type, title, text }) => {
					expect(type).toBe('success');
					expect(title).toBe('Hello');
					expect(text).toBe('world');
				});
			const [res] = await exe(`
				<: Mk:dialog('Hello', 'world', 'success')
			`);
			expect(res).toStrictEqual(values.NULL);
			expect(osMock.alert).toHaveBeenCalledOnce();
		});

		test('omit type', { concurrent: false }, async () => {
			osMock.alert.mockImplementationOnce(async ({ type, title, text }) => {
					expect(type).toBe('info');
					expect(title).toBe('Hello');
					expect(text).toBe('world');
				});
			const [res] = await exe(`
				<: Mk:dialog('Hello', 'world')
			`);
			expect(res).toStrictEqual(values.NULL);
			expect(osMock.alert).toHaveBeenCalledOnce();
		});

		test('invalid type', { concurrent: false }, async () => {
			await expect(() => exe(`
				<: Mk:dialog('Hello', 'world', 'invalid')
			`)).rejects.toBeInstanceOf(errors.AiScriptRuntimeError);
			expect(osMock.alert).not.toHaveBeenCalled();
		});
	});

	describe('confirm', { concurrent: false }, () => {
		beforeEach(() => {
			vi.restoreAllMocks();
			vi.clearAllMocks();
		});

		test('ok', async () => {
			osMock.confirm.mockImplementationOnce(async ({ type, title, text }) => {
					expect(type).toBe('success');
					expect(title).toBe('Hello');
					expect(text).toBe('world');
					return { canceled: false };
				});
			const [res] = await exe(`
				<: Mk:confirm('Hello', 'world', 'success')
			`);
			expect(res).toStrictEqual(values.TRUE);
			expect(osMock.confirm).toHaveBeenCalledOnce();
		});

		test('omit type', async () => {
			osMock.confirm
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
			expect(osMock.confirm).toHaveBeenCalledOnce();
		});

		test('canceled', async () => {
			osMock.confirm.mockImplementationOnce(async ({ type, title, text }) => {
					expect(type).toBe('question');
					expect(title).toBe('Hello');
					expect(text).toBe('world');
					return { canceled: true };
				});
			const [res] = await exe(`
				<: Mk:confirm('Hello', 'world')
			`);
			expect(res).toStrictEqual(values.FALSE);
			expect(osMock.confirm).toHaveBeenCalledOnce();
		});

		test('invalid type', async () => {
			const confirm = osMock.confirm;
			await expect(() => exe(`
				<: Mk:confirm('Hello', 'world', 'invalid')
			`)).rejects.toBeInstanceOf(errors.AiScriptRuntimeError);
			expect(confirm).not.toHaveBeenCalled();
		});
	});

	describe('api', { concurrent: false }, () => {
		beforeEach(() => {
			vi.restoreAllMocks();
			vi.clearAllMocks();
		});

		test('successful', async () => {
			misskeyApiMock.mockImplementationOnce(
				async (endpoint, data, token) => {
					expect(endpoint).toBe('ping');
					expect(data).toStrictEqual({});
					expect(token).toBeNull();
					return { pong: 1735657200000 };
				}
			);
			const [res] = await exe(`
				<: Mk:api('ping', {})
			`);
			expect(res).toStrictEqual(values.OBJ(new Map([
				['pong', values.NUM(1735657200000)],
			])));
			expect(misskeyApiMock).toHaveBeenCalledOnce();
		});

		test('with token', async () => {
			misskeyApiMock.mockImplementationOnce(
				async (endpoint, data, token) => {
					expect(endpoint).toBe('ping');
					expect(data).toStrictEqual({});
					expect(token).toStrictEqual('xxxxxxxx');
					return { pong: 1735657200000 };
				}
			);
			const [res] = await exe(`
				<: Mk:api('ping', {}, 'xxxxxxxx')
			`);
			expect(res).toStrictEqual(values.OBJ(new Map([
				['pong', values.NUM(1735657200000 )],
			])));
			expect(misskeyApiMock).toHaveBeenCalledOnce();
		});

		test('request failed', async () => {
			misskeyApiMock.mockRejectedValueOnce('Not Found');
			const [res] = await exe(`
				<: Mk:api('this/endpoint/should/not/be/found', {})
			`);
			expect(res).toStrictEqual(
				values.ERROR('request_failed', values.STR('Not Found'))
			);
			expect(misskeyApiMock).toHaveBeenCalledOnce();
		});

		test('invalid endpoint', async () => {
			await expect(() => exe(`
				Mk:api('https://example.com/api/ping', {})
			`)).rejects.toStrictEqual(
				errorWithPos(new errors.AiScriptRuntimeError('invalid endpoint'), 2, 11),
			);
			expect(misskeyApiMock).not.toHaveBeenCalled();
		});

		test('missing param', async () => {
			await expect(() => exe(`
				Mk:api('ping')
			`)).rejects.toStrictEqual(
				errorWithPos(new errors.AiScriptRuntimeError('expected param'), 2, 11),
			);
			expect(misskeyApiMock).not.toHaveBeenCalled();
		});
	});

	describe('save and load', { concurrent: false }, () => {
		beforeEach(() => {
			miLocalStorage.removeItem('aiscript:widget:key');
		});

		beforeEach(() => {
			miLocalStorage.removeItem('aiscript:widget:key');
		});

		test('successful', async () => {
			const [res] = await exe(`
				Mk:save('key', 'value')
				<: Mk:load('key')
			`);
			expect(miLocalStorage.getItem('aiscript:widget:key')).toBe('"value"');
			expect(res).toStrictEqual(values.STR('value'));
		});

		test('missing value to save', async () => {
			await expect(() => exe(`
				Mk:save('key')
			`)).rejects.toStrictEqual(
				errorWithPos(new errors.AiScriptRuntimeError('Expect anything, but got nothing.'), 2, 12),
			);
		});

		test('not value found to load', async () => {
			const [res] = await exe(`
				<: Mk:load('key')
			`);
			expect(res).toStrictEqual(values.NULL);
		});

		test('remove existing', async () => {
			const res = await exe(`
				Mk:save('key', 'value')
				<: Mk:load('key')
				<: Mk:remove('key')
				<: Mk:load('key')
			`);
			expect(res).toStrictEqual([values.STR('value'), values.NULL, values.NULL]);
		});

		test('remove nothing', async () => {
			const res = await exe(`
				<: Mk:load('key')
				<: Mk:remove('key')
				<: Mk:load('key')
			`);
			expect(res).toStrictEqual([values.NULL, values.NULL, values.NULL]);
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
