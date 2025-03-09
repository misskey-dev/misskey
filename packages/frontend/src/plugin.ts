/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, defineAsyncComponent } from 'vue';
import { Interpreter, Parser, utils, values } from '@syuilo/aiscript';
import { compareVersions } from 'compare-versions';
import { v4 as uuid } from 'uuid';
import * as Misskey from 'misskey-js';
import { aiScriptReadline, createAiScriptEnv } from '@/aiscript/api.js';
import { store } from '@/store.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';

export type Plugin = {
	installId: string;
	name: string;
	active: boolean;
	config?: Record<string, { default: any }>;
	configData: Record<string, any>;
	src: string | null;
	version: string;
	author?: string;
	description?: string;
	permissions?: string[];
};

export type AiScriptPluginMeta = {
	name: string;
	version: string;
	author: string;
	description?: string;
	permissions?: string[];
	config?: Record<string, any>;
};

const parser = new Parser();

export function isSupportedAiScriptVersion(version: string): boolean {
	try {
		return (compareVersions(version, '0.12.0') >= 0);
	} catch (err) {
		return false;
	}
}

export async function parsePluginMeta(code: string): Promise<AiScriptPluginMeta> {
	if (!code) {
		throw new Error('code is required');
	}

	const lv = utils.getLangVersion(code);
	if (lv == null) {
		throw new Error('No language version annotation found');
	} else if (!isSupportedAiScriptVersion(lv)) {
		throw new Error(`Aiscript version '${lv}' is not supported`);
	}

	let ast;
	try {
		ast = parser.parse(code);
	} catch (err) {
		throw new Error('Aiscript syntax error');
	}

	const meta = Interpreter.collectMetadata(ast);
	if (meta == null) {
		throw new Error('Meta block not found');
	}

	const metadata = meta.get(null);
	if (metadata == null) {
		throw new Error('Metadata not found');
	}

	const { name, version, author, description, permissions, config } = metadata;
	if (name == null || version == null || author == null) {
		throw new Error('Required property not found');
	}

	return {
		name,
		version,
		author,
		description,
		permissions,
		config,
	};
}

export async function authorizePlugin(plugin: Plugin) {
	if (plugin.permissions == null || plugin.permissions.length === 0) return;
	if (Object.hasOwn(store.state.pluginTokens, plugin.installId)) return;

	const token = await new Promise<string>((res, rej) => {
		const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkTokenGenerateWindow.vue')), {
			title: i18n.ts.tokenRequested,
			information: i18n.ts.pluginTokenRequestedDescription,
			initialName: plugin.name,
			initialPermissions: plugin.permissions,
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
		});
	});

	store.set('pluginTokens', {
		...store.state.pluginTokens,
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

	const installId = uuid();

	const plugin = {
		...realMeta,
		installId,
		active: true,
		configData: {},
		src: code,
	};

	prefer.set('plugins', prefer.s.plugins.concat(plugin));

	await authorizePlugin(plugin);
}

export async function uninstallPlugin(plugin: Plugin) {
	prefer.set('plugins', prefer.s.plugins.filter(x => x.installId !== plugin.installId));
	if (Object.hasOwn(store.state.pluginTokens, plugin.installId)) {
		await os.apiWithDialog('i/revoke-token', {
			token: store.state.pluginTokens[plugin.installId],
		});
		const pluginTokens = { ...store.state.pluginTokens };
		delete pluginTokens[plugin.installId];
		store.set('pluginTokens', pluginTokens);
	}
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

	prefer.set('plugins', prefer.s.plugins.map(x => x.installId === plugin.installId ? { ...x, configData: result } : x));
}

export function changePluginActive(plugin: Plugin, active: boolean) {
	prefer.set('plugins', prefer.s.plugins.map(x => x.installId === plugin.installId ? { ...x, active } : x));
}

const pluginContexts = new Map<string, Interpreter>();
export const pluginLogs = ref(new Map<string, string[]>());

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
		handler: (note: Misskey.entities.Note) => unknown;
	};
	note_post_interruptor: {
		handler: (note: FIXME) => unknown;
	};
	page_view_interruptor: {
		handler: (page: Misskey.entities.Page) => unknown;
	};
};

type PluginHandler<K extends keyof HandlerDef> = {
	pluginInstallId: string;
	type: K;
	ctx: HandlerDef[K];
};

let pluginHandlers: PluginHandler<keyof HandlerDef>[] = [];

function addPluginHandler<K extends keyof HandlerDef>(installId: Plugin['installId'], type: K, ctx: PluginHandler<K>['ctx']) {
	pluginHandlers.push({ pluginInstallId: installId, type, ctx });
}

export async function launchPlugin(plugin: Plugin): Promise<void> {
	// 後方互換性のため
	if (plugin.src == null) return;

	await authorizePlugin(plugin);

	const aiscript = new Interpreter(createPluginEnv({
		plugin: plugin,
		storageKey: 'plugins:' + plugin.installId,
	}), {
		in: aiScriptReadline,
		out: (value): void => {
			console.log(value);
			pluginLogs.value.get(plugin.installId).push(utils.reprValue(value));
		},
		log: (): void => {
		},
		err: (err): void => {
			pluginLogs.value.get(plugin.installId).push(`${err}`);
			throw err; // install時のtry-catchに反応させる
		},
	});

	pluginContexts.set(plugin.installId, aiscript);
	pluginLogs.value.set(plugin.installId, []);

	aiscript.exec(parser.parse(plugin.src)).then(
		() => {
			console.info('Plugin installed:', plugin.name, 'v' + plugin.version);
		},
		(err) => {
			console.error('Plugin install failed:', plugin.name, 'v' + plugin.version);
			throw err;
		},
	);
}

export function reloadPlugin(plugin: Plugin): void {
	const pluginContext = pluginContexts.get(plugin.installId);
	if (!pluginContext) return;

	pluginContext.abort();
	pluginContexts.delete(plugin.installId);
	pluginLogs.value.delete(plugin.installId);
	pluginHandlers = pluginHandlers.filter(x => x.pluginInstallId !== plugin.installId);

	launchPlugin(plugin);
}

function createPluginEnv(opts: { plugin: Plugin; storageKey: string }): Record<string, values.Value> {
	const id = opts.plugin.installId;

	const config = new Map<string, values.Value>();
	for (const [k, v] of Object.entries(opts.plugin.config ?? {})) {
		config.set(k, utils.jsToVal(typeof opts.plugin.configData[k] !== 'undefined' ? opts.plugin.configData[k] : v.default));
	}

	function withContext<T>(fn: (ctx: Interpreter) => T): T {
		console.log('withContext', id);
		const ctx = pluginContexts.get(id);
		if (!ctx) throw new Error('Plugin context not found');
		return fn(ctx);
	}

	return {
		...createAiScriptEnv({ ...opts, token: store.state.pluginTokens[id] }),

		'Plugin:register_post_form_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			utils.assertFunction(handler);
			addPluginHandler(id, 'post_form_action', {
				title: title.value,
				handler: withContext(ctx => (form, update) => {
					ctx.execFn(handler, [utils.jsToVal(form), values.FN_NATIVE(([key, value]) => {
						if (!key || !value) {
							return;
						}
						update(utils.valToJs(key), utils.valToJs(value));
					})]);
				}),
			});
		}),

		'Plugin:register_user_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			utils.assertFunction(handler);
			addPluginHandler(id, 'user_action', {
				title: title.value,
				handler: withContext(ctx => (user) => {
					ctx.execFn(handler, [utils.jsToVal(user)]);
				}),
			});
		}),

		'Plugin:register_note_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			utils.assertFunction(handler);
			addPluginHandler(id, 'note_action', {
				title: title.value,
				handler: withContext(ctx => (note) => {
					ctx.execFn(handler, [utils.jsToVal(note)]);
				}),
			});
		}),

		'Plugin:register_note_view_interruptor': values.FN_NATIVE(([handler]) => {
			utils.assertFunction(handler);
			addPluginHandler(id, 'note_view_interruptor', {
				handler: withContext(ctx => async (note) => {
					return utils.valToJs(await ctx.execFn(handler, [utils.jsToVal(note)]));
				}),
			});
		}),

		'Plugin:register_note_post_interruptor': values.FN_NATIVE(([handler]) => {
			utils.assertFunction(handler);
			addPluginHandler(id, 'note_post_interruptor', {
				handler: withContext(ctx => async (note) => {
					return utils.valToJs(await ctx.execFn(handler, [utils.jsToVal(note)]));
				}),
			});
		}),

		'Plugin:register_page_view_interruptor': values.FN_NATIVE(([handler]) => {
			utils.assertFunction(handler);
			addPluginHandler(id, 'page_view_interruptor', {
				handler: withContext(ctx => async (page) => {
					return utils.valToJs(await ctx.execFn(handler, [utils.jsToVal(page)]));
				}),
			});
		}),

		'Plugin:open_url': values.FN_NATIVE(([url]) => {
			utils.assertString(url);
			window.open(url.value, '_blank', 'noopener');
		}),

		'Plugin:config': values.OBJ(config),
	};
}

export function getPluginHandlers<K extends keyof HandlerDef>(type: K): HandlerDef[K][] {
	return pluginHandlers.filter((x): x is PluginHandler<K> => x.type === type).map(x => x.ctx);
}
