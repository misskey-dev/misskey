/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Interpreter, Parser, utils, values } from '@syuilo/aiscript';
import { createAiScriptEnv } from '@/scripts/aiscript/api.js';
import { inputText } from '@/os.js';
import { Plugin, noteActions, notePostInterruptors, noteViewInterruptors, postFormActions, userActions, pageViewInterruptors } from '@/store.js';

const parser = new Parser();
const pluginContexts = new Map<string, Interpreter>();

export async function install(plugin: Plugin): Promise<void> {
	// 後方互換性のため
	if (plugin.src == null) return;

	const aiscript = new Interpreter(createPluginEnv({
		plugin: plugin,
		storageKey: 'plugins:' + plugin.id,
	}), {
		in: (q): Promise<string> => {
			return new Promise(ok => {
				inputText({
					title: q,
				}).then(({ canceled, result: a }) => {
					if (canceled) {
						ok('');
					} else {
						ok(a);
					}
				});
			});
		},
		out: (value): void => {
			console.log(value);
		},
		log: (): void => {
		},
	});

	initPlugin({ plugin, aiscript });

	try {
		await aiscript.exec(parser.parse(plugin.src));
	} catch (err) {
		console.error('Plugin install failed:', plugin.name, 'v' + plugin.version);
		return;
	}

	console.info('Plugin installed:', plugin.name, 'v' + plugin.version);
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
			window.open(url.value, '_blank');
		}),
		'Plugin:config': values.OBJ(config),
	};
}

function initPlugin({ plugin, aiscript }): void {
	pluginContexts.set(plugin.id, aiscript);
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
