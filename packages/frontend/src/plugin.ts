/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref } from 'vue';
import { compareVersions } from 'compare-versions';
import { isSafeMode } from '@@/js/config.js';
import * as Misskey from 'misskey-js';
import type { Parser, Interpreter, values, utils as utils_TypeReferenceOnly } from '@syuilo/aiscript';
import type { FormWithDefault } from '@/utility/form.js';
import { genId } from '@/utility/id.js';
import { store } from '@/store.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';

export type Plugin = {
	installId: string;
	name: string;
	active: boolean;
	config?: FormWithDefault;
	configData: Record<string, any>;
	src: string | null;
	version: string;
	author?: string;
	description?: string;
	permissions?: (typeof Misskey.permissions)[number][];
};

export type AiScriptPluginMeta = {
	name: string;
	version: string;
	author: string;
	description?: string;
	permissions?: (typeof Misskey.permissions)[number][];
	config?: Record<string, any>;
};

let _parser: Parser | null = null;

async function getParser(): Promise<Parser> {
	const { Parser } = await import('@syuilo/aiscript');
	_parser ??= new Parser();
	return _parser;
}

export function isSupportedAiScriptVersion(version: string): boolean {
	try {
		return (compareVersions(version, '0.12.0') >= 0);
	} catch (_) {
		return false;
	}
}

export async function parsePluginMeta(code: string): Promise<AiScriptPluginMeta> {
	if (!code) {
		throw new Error('code is required');
	}

	const { Interpreter, utils } = await import('@syuilo/aiscript');

	const lv = utils.getLangVersion(code);
	if (lv == null) {
		throw new Error('No language version annotation found');
	} else if (!isSupportedAiScriptVersion(lv)) {
		throw new Error(`Aiscript version '${lv}' is not supported`);
	}

	let ast;
	try {
		const parser = await getParser();
		ast = parser.parse(code);
	} catch (_) {
		throw new Error('Aiscript syntax error');
	}

	const meta = Interpreter.collectMetadata(ast);
	if (meta == null) {
		throw new Error('Meta block not found');
	}

	const metadata = meta.get(null);
	if (metadata == null || typeof metadata !== 'object' || Array.isArray(metadata)) {
		throw new Error('Metadata not found or invalid');
	}

	const { name, version, author, description, permissions, config } = metadata;

	if (name == null || version == null || author == null) {
		throw new Error('Required property not found');
	}

	return {
		name: name as string,
		version: version as string,
		author: author as string,
		description: description as string | undefined,
		permissions: permissions as (typeof Misskey.permissions)[number][] | undefined,
		config: config as Record<string, any> | undefined,
	};
}

export async function authorizePlugin(plugin: Plugin) {
	if (plugin.permissions == null || plugin.permissions.length === 0) return;
	if (Object.hasOwn(store.s.pluginTokens, plugin.installId)) return;

	const token = await new Promise<string>((res, rej) => {
		let dispose: () => void;
		os.popupAsyncWithDialog(import('@/components/MkTokenGenerateWindow.vue').then(x => x.default), {
			title: i18n.ts.tokenRequested,
			information: i18n.ts.pluginTokenRequestedDescription,
			initialName: plugin.name,
			initialPermissions: plugin.permissions as typeof Misskey.permissions[number][],
		}, {
			done: async result => {
				const { name, permissions } = result;
				const { token } = await misskeyApi('miauth/gen-token', {
					session: null,
					name: name,
					permission: permissions,
				});
				res(token);
			},
			closed: () => dispose(),
		}).then(d => dispose = d.dispose, err => rej(err));
	});

	store.set('pluginTokens', {
		...store.s.pluginTokens,
		[plugin.installId]: token,
	});
}

export async function installPlugin(code: string, meta?: AiScriptPluginMeta) {
	if (!code) return;

	let realMeta: AiScriptPluginMeta;
	if (!meta) {
		realMeta = await parsePluginMeta(code);
	} else {
		realMeta = meta;
	}

	if (prefer.s.plugins.some(x => x.name === realMeta.name)) {
		throw new Error('Plugin already installed');
	}

	const installId = genId();

	const plugin = {
		...realMeta,
		config: realMeta.config ?? {},
		installId,
		active: true,
		configData: {},
		src: code,
	};

	prefer.commit('plugins', prefer.s.plugins.concat(plugin));

	await authorizePlugin(plugin);

	await launchPlugin(installId);
}

export async function uninstallPlugin(plugin: Plugin) {
	abortPlugin(plugin);
	prefer.commit('plugins', prefer.s.plugins.filter(x => x.installId !== plugin.installId));

	Object.keys(window.localStorage).forEach(key => {
		if (key.startsWith('aiscript:plugins:' + plugin.installId)) {
			window.localStorage.removeItem(key);
		}
	});

	if (Object.hasOwn(store.s.pluginTokens, plugin.installId)) {
		await os.apiWithDialog('i/revoke-token', {
			token: store.s.pluginTokens[plugin.installId],
		});
		const pluginTokens = { ...store.s.pluginTokens };
		delete pluginTokens[plugin.installId];
		store.set('pluginTokens', pluginTokens);
	}
}

const pluginContexts = new Map<Plugin['installId'], Interpreter>();

export const pluginLogs = ref(new Map<Plugin['installId'], {
	at: number;
	message: string;
	isSystem?: boolean;
	isError?: boolean;
}[]>());

type HandlerDef = {
	post_form_action: {
		title: string,
		handler: <T>(form: T, update: (key: unknown, value: unknown) => void) => void;
	};
	user_action: {
		title: string,
		handler: (user: Misskey.entities.UserDetailed) => void;
	};
	note_action: {
		title: string,
		handler: (note: Misskey.entities.Note) => void;
	};
	note_view_interruptor: {
		handler: (note: Misskey.entities.Note) => Misskey.entities.Note | null;
	};
	note_post_interruptor: {
		handler: (note: FIXME) => unknown;
	};
	page_view_interruptor: {
		handler: (page: Misskey.entities.Page) => Misskey.entities.Page;
	};
};

type PluginHandler<K extends keyof HandlerDef> = {
	pluginInstallId: string;
	type: K;
	ctx: HandlerDef[K];
};

let pluginHandlers: PluginHandler<keyof HandlerDef>[] = [];

function addPluginHandler<K extends keyof HandlerDef>(installId: Plugin['installId'], type: K, ctx: PluginHandler<K>['ctx']) {
	pluginLogs.value.get(installId)!.push({
		at: Date.now(),
		isSystem: true,
		message: `Handler registered: ${type}`,
	});
	pluginHandlers.push({ pluginInstallId: installId, type, ctx });
}

export function launchPlugins() {
	return Promise.all(prefer.s.plugins.map(plugin => {
		if (plugin.active) {
			return launchPlugin(plugin.installId);
		} else {
			return Promise.resolve();
		}
	}));
}

async function launchPlugin(id: Plugin['installId']): Promise<void> {
	if (isSafeMode) return;
	const plugin = prefer.s.plugins.find(x => x.installId === id);
	if (!plugin) return;

	// 後方互換性のため
	if (plugin.src == null) return;

	pluginLogs.value.set(plugin.installId, []);

	function systemLog(message: string, isError = false): void {
		pluginLogs.value.get(plugin!.installId)?.push({
			at: Date.now(),
			isSystem: true,
			message,
			isError,
		});
	}

	systemLog('Starting plugin...');

	await authorizePlugin(plugin);

	const { Interpreter, utils } = await import('@syuilo/aiscript');
	const { aiScriptReadline } = await import('@/aiscript/api.js');

	const aiscript = new Interpreter(await createPluginEnv({
		plugin: plugin,
		storageKey: 'plugins:' + plugin.installId,
	}), {
		in: aiScriptReadline,
		out: (value): void => {
			pluginLogs.value.get(plugin.installId)!.push({
				at: Date.now(),
				message: utils.reprValue(value),
			});
		},
		log: (): void => {
		},
		err: (err): void => {
			pluginLogs.value.get(plugin.installId)!.push({
				at: Date.now(),
				message: `${err}`,
				isError: true,
			});
			throw err; // install時のtry-catchに反応させる
		},
	});

	pluginContexts.set(plugin.installId, aiscript);

	const parser = await getParser();
	await aiscript.exec(parser.parse(plugin.src)).then(
		() => {
			console.info('Plugin installed:', plugin.name, 'v' + plugin.version);
			systemLog('Plugin started');
		},
		(err) => {
			console.error('Plugin install failed:', plugin.name, 'v' + plugin.version);
			systemLog(`${err}`, true);
			throw err;
		},
	);
}

export function abortPlugin(plugin: Plugin): void {
	const pluginContext = pluginContexts.get(plugin.installId);
	if (!pluginContext) return;

	pluginContext.abort();
	pluginContexts.delete(plugin.installId);
	pluginLogs.value.delete(plugin.installId);
	pluginHandlers = pluginHandlers.filter(x => x.pluginInstallId !== plugin.installId);
}

export function reloadPlugin(plugin: Plugin): void {
	abortPlugin(plugin);
	launchPlugin(plugin.installId);
}

export async function configPlugin(plugin: Plugin) {
	if (plugin.config == null) {
		throw new Error('This plugin does not have a config');
	}

	const config = plugin.config;
	for (const key in plugin.configData) {
		config[key].default = plugin.configData[key];
	}

	const { canceled, result } = await os.form(plugin.name, config);
	if (canceled) return;

	prefer.commit('plugins', prefer.s.plugins.map(x => x.installId === plugin.installId ? { ...x, configData: result } : x));

	reloadPlugin(plugin);
}

export function changePluginActive(plugin: Plugin, active: boolean) {
	prefer.commit('plugins', prefer.s.plugins.map(x => x.installId === plugin.installId ? { ...x, active } : x));

	if (active) {
		launchPlugin(plugin.installId);
	} else {
		abortPlugin(plugin);
	}
}

async function createPluginEnv(opts: { plugin: Plugin; storageKey: string }): Promise<Record<string, values.Value>> {
	const id = opts.plugin.installId;

	const ais = await import('@syuilo/aiscript');
	const values = ais.values;
	const utils: typeof utils_TypeReferenceOnly = ais.utils;
	const { createAiScriptEnv } = await import('@/aiscript/api.js');

	const config = new Map<string, values.Value>();
	for (const [k, v] of Object.entries(opts.plugin.config ?? {})) {
		config.set(k, utils.jsToVal(typeof opts.plugin.configData[k] !== 'undefined' ? opts.plugin.configData[k] : v.default));
	}

	function withContext<T>(fn: (ctx: Interpreter) => T): T {
		const ctx = pluginContexts.get(id);
		if (!ctx) throw new Error('Plugin context not found');
		return fn(ctx);
	}

	const env: Record<string, values.Value> = {
		...createAiScriptEnv({ ...opts, token: store.s.pluginTokens[id] }),

		'Plugin:register:post_form_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			utils.assertFunction(handler);
			addPluginHandler(id, 'post_form_action', {
				title: title.value,
				handler: (form, update) => withContext(ctx => {
					ctx.execFn(handler, [utils.jsToVal(form), values.FN_NATIVE(([key, value]) => {
						if (!key || !value) {
							return;
						}
						update(utils.valToJs(key), utils.valToJs(value));
					})]);
				}),
			});
		}),

		'Plugin:register:user_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			utils.assertFunction(handler);
			addPluginHandler(id, 'user_action', {
				title: title.value,
				handler: (user) => withContext(ctx => {
					ctx.execFn(handler, [utils.jsToVal(user)]);
				}),
			});
		}),

		'Plugin:register:note_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			utils.assertFunction(handler);
			addPluginHandler(id, 'note_action', {
				title: title.value,
				handler: (note) => withContext(ctx => {
					ctx.execFn(handler, [utils.jsToVal(note)]);
				}),
			});
		}),

		'Plugin:register:note_view_interruptor': values.FN_NATIVE(([handler]) => {
			utils.assertFunction(handler);
			addPluginHandler(id, 'note_view_interruptor', {
				handler: (note) => withContext(ctx => {
					return utils.valToJs(ctx.execFnSync(handler, [utils.jsToVal(note)])) as Misskey.entities.Note | null;
				}),
			});
		}),

		'Plugin:register:note_post_interruptor': values.FN_NATIVE(([handler]) => {
			utils.assertFunction(handler);
			addPluginHandler(id, 'note_post_interruptor', {
				handler: (note) => withContext(ctx => {
					return utils.valToJs(ctx.execFnSync(handler, [utils.jsToVal(note)]));
				}),
			});
		}),

		'Plugin:register:page_view_interruptor': values.FN_NATIVE(([handler]) => {
			utils.assertFunction(handler);
			addPluginHandler(id, 'page_view_interruptor', {
				handler: (page) => withContext(ctx => {
					return utils.valToJs(ctx.execFnSync(handler, [utils.jsToVal(page)])) as Misskey.entities.Page;
				}),
			});
		}),

		'Plugin:open_url': values.FN_NATIVE(([url]) => {
			utils.assertString(url);
			window.open(url.value, '_blank', 'noopener');
		}),

		'Plugin:config': values.OBJ(config),
	};

	// 後方互換性のため
	env['Plugin:register_post_form_action'] = env['Plugin:register:post_form_action'];
	env['Plugin:register_user_action'] = env['Plugin:register:user_action'];
	env['Plugin:register_note_action'] = env['Plugin:register:note_action'];
	env['Plugin:register_note_view_interruptor'] = env['Plugin:register:note_view_interruptor'];
	env['Plugin:register_note_post_interruptor'] = env['Plugin:register:note_post_interruptor'];
	env['Plugin:register_page_view_interruptor'] = env['Plugin:register:page_view_interruptor'];

	return env;
}

export function getPluginHandlers<K extends keyof HandlerDef>(type: K): HandlerDef[K][] {
	return pluginHandlers.filter((x): x is PluginHandler<K> => x.type === type).map(x => x.ctx);
}
