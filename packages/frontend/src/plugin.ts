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

interface PostFormAction {
	title: string,
	handler: <T>(form: T, update: (key: unknown, value: unknown) => void) => void;
}

interface UserAction {
	title: string,
	handler: (user: Misskey.entities.UserDetailed) => void;
}

interface NoteAction {
	title: string,
	handler: (note: Misskey.entities.Note) => void;
}

interface NoteViewInterruptor {
	handler: (note: Misskey.entities.Note) => unknown;
}

interface NotePostInterruptor {
	handler: (note: FIXME) => unknown;
}

interface PageViewInterruptor {
	handler: (page: Misskey.entities.Page) => unknown;
}

export const postFormActions: PostFormAction[] = [];
export const userActions: UserAction[] = [];
export const noteActions: NoteAction[] = [];
export const noteViewInterruptors: NoteViewInterruptor[] = [];
export const notePostInterruptors: NotePostInterruptor[] = [];
export const pageViewInterruptors: PageViewInterruptor[] = [];

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

function createPluginEnv(opts: { plugin: Plugin; storageKey: string }): Record<string, values.Value> {
	const id = opts.plugin.installId;

	const config = new Map<string, values.Value>();
	for (const [k, v] of Object.entries(opts.plugin.config ?? {})) {
		config.set(k, utils.jsToVal(typeof opts.plugin.configData[k] !== 'undefined' ? opts.plugin.configData[k] : v.default));
	}

	return {
		...createAiScriptEnv({ ...opts, token: store.state.pluginTokens[id] }),

		'Plugin:register_post_form_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			registerPostFormAction({ pluginId: id, title: title.value, handler });
		}),
		'Plugin:register_user_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			registerUserAction({ pluginId: id, title: title.value, handler });
		}),
		'Plugin:register_note_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			registerNoteAction({ pluginId: id, title: title.value, handler });
		}),
		'Plugin:register_note_view_interruptor': values.FN_NATIVE(([handler]) => {
			registerNoteViewInterruptor({ pluginId: id, handler });
		}),
		'Plugin:register_note_post_interruptor': values.FN_NATIVE(([handler]) => {
			registerNotePostInterruptor({ pluginId: id, handler });
		}),
		'Plugin:register_page_view_interruptor': values.FN_NATIVE(([handler]) => {
			registerPageViewInterruptor({ pluginId: id, handler });
		}),
		'Plugin:open_url': values.FN_NATIVE(([url]) => {
			utils.assertString(url);
			window.open(url.value, '_blank', 'noopener');
		}),
		'Plugin:config': values.OBJ(config),
	};
}

function registerPostFormAction({ pluginId, title, handler }): void {
	postFormActions.push({
		title, handler: (form, update) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) {
				return;
			}
			pluginContext.execFn(handler, [utils.jsToVal(form), values.FN_NATIVE(([key, value]) => {
				if (!key || !value) {
					return;
				}
				update(utils.valToJs(key), utils.valToJs(value));
			})]);
		},
	});
}

function registerUserAction({ pluginId, title, handler }): void {
	userActions.push({
		title, handler: (user) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) {
				return;
			}
			pluginContext.execFn(handler, [utils.jsToVal(user)]);
		},
	});
}

function registerNoteAction({ pluginId, title, handler }): void {
	noteActions.push({
		title, handler: (note) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) {
				return;
			}
			pluginContext.execFn(handler, [utils.jsToVal(note)]);
		},
	});
}

function registerNoteViewInterruptor({ pluginId, handler }): void {
	noteViewInterruptors.push({
		handler: async (note) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) {
				return;
			}
			return utils.valToJs(await pluginContext.execFn(handler, [utils.jsToVal(note)]));
		},
	});
}

function registerNotePostInterruptor({ pluginId, handler }): void {
	notePostInterruptors.push({
		handler: async (note) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) {
				return;
			}
			return utils.valToJs(await pluginContext.execFn(handler, [utils.jsToVal(note)]));
		},
	});
}

function registerPageViewInterruptor({ pluginId, handler }): void {
	pageViewInterruptors.push({
		handler: async (page) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) {
				return;
			}
			return utils.valToJs(await pluginContext.execFn(handler, [utils.jsToVal(page)]));
		},
	});
}
