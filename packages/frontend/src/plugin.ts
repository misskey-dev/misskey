/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref } from 'vue';
import { Interpreter, Parser, utils, values } from '@syuilo/aiscript';
import { aiScriptReadline, createAiScriptEnv } from '@/scripts/aiscript/api.js';
import { Plugin, noteActions, notePostInterruptors, noteViewInterruptors, postFormActions, userActions, pageViewInterruptors } from '@/store.js';

const parser = new Parser();
const pluginContexts = new Map<string, Interpreter>();
export const pluginLogs = ref(new Map<string, string[]>());

export async function install(plugin: Plugin): Promise<void> {
	// 後方互換性のため
	if (plugin.src == null) return;

	const aiscriptForInstall = new Interpreter(createPluginEnv({
		plugin: plugin,
		storageKey: 'plugins:' + plugin.id,
	}), {
		in: aiScriptReadline,
		out: (value): void => {
			console.log(value);
			pluginLogs.value.get(plugin.id)?.push(utils.reprValue(value));
		},
		log: (): void => {
		},
		err: (err): void => {
			pluginLogs.value.get(plugin.id)?.push(`${err}`);
			throw err; // install時のtry-catchに反応させる
		},
	});

	const aiscriptForExec = new Interpreter(createPluginEnv({
		plugin,
		storageKey: 'plugins:' + plugin.id,
	}), {
		in: aiScriptReadline,
		out: (value): void => {
			console.log(value);
			pluginLogs.value.get(plugin.id)?.push(utils.reprValue(value));
		},
	});

	initPlugin({ plugin, aiscript: aiscriptForExec });

	aiscriptForInstall.exec(parser.parse(plugin.src)).then(
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
	const config = new Map<string, values.Value>();
	for (const [k, v] of Object.entries(opts.plugin.config ?? {})) {
		config.set(k, utils.jsToVal(typeof opts.plugin.configData[k] !== 'undefined' ? opts.plugin.configData[k] : v.default));
	}

	return {
		...createAiScriptEnv({ ...opts, token: opts.plugin.token }),
		//#region Deprecated
		'Mk:register_post_form_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			registerPostFormAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Mk:register_user_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			registerUserAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Mk:register_note_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			registerNoteAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		//#endregion
		'Plugin:register_post_form_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			registerPostFormAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_user_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			registerUserAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_note_action': values.FN_NATIVE(([title, handler]) => {
			utils.assertString(title);
			registerNoteAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_note_view_interruptor': values.FN_NATIVE(([handler]) => {
			registerNoteViewInterruptor({ pluginId: opts.plugin.id, handler });
		}),
		'Plugin:register_note_post_interruptor': values.FN_NATIVE(([handler]) => {
			registerNotePostInterruptor({ pluginId: opts.plugin.id, handler });
		}),
		'Plugin:register_page_view_interruptor': values.FN_NATIVE(([handler]) => {
			registerPageViewInterruptor({ pluginId: opts.plugin.id, handler });
		}),
		'Plugin:open_url': values.FN_NATIVE(([url]) => {
			utils.assertString(url);
			window.open(url.value, '_blank', 'noopener');
		}),
		'Plugin:config': values.OBJ(config),
	};
}

function initPlugin({ plugin, aiscript }): void {
	pluginContexts.set(plugin.id, aiscript);
	pluginLogs.value.set(plugin.id, []);
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
			})]).catch((err) => {
				pluginLogs.value.get(pluginId)?.push(`${err}`);
				throw err;
			});
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
			pluginContext.execFn(handler, [utils.jsToVal(user)]).catch((err) => {
				pluginLogs.value.get(pluginId)?.push(`${err}`);
				throw err;
			});
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
			pluginContext.execFn(handler, [utils.jsToVal(note)]).catch((err) => {
				pluginLogs.value.get(pluginId)?.push(`${err}`);
				throw err;
			});
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
			try {
				const res = await pluginContext.execFn(handler, [utils.jsToVal(note)]);
				return utils.valToJs(res);
			} catch (err) {
				pluginLogs.value.get(pluginId)?.push(`${err}`);
				throw err;
			}
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
			try {
				const res = await pluginContext.execFn(handler, [utils.jsToVal(note)]);
				return utils.valToJs(res);
			} catch (err) {
				pluginLogs.value.get(pluginId)?.push(`${err}`);
				throw err;
			}
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
			try {
				const res = await pluginContext.execFn(handler, [utils.jsToVal(page)]);
				return utils.valToJs(res);
			} catch (err) {
				pluginLogs.value.get(pluginId)?.push(`${err}`);
				throw err;
			}
		},
	});
}
