// @ts-ignore
import { Interpreter, utils, values, Parser } from '@syuilo/aiscript';
import { createAiScriptEnv } from '@/scripts/aiscript/api';
import { inputText } from '@/os';
import { noteActions, notePostInterruptors, noteViewInterruptors, postFormActions, userActions } from '@/store';

const pluginContexts = new Map<string, Interpreter>();

export function install(plugin) {
	console.info('Plugin installed:', plugin.name, 'v' + plugin.version);

	const aiscript = new Interpreter(createPluginEnv({
		plugin: plugin,
		storageKey: 'plugins:' + plugin.id,
	}), {
		in: (q) => {
			return new Promise(ok => {
				inputText({
					title: q,
				}).then(({ canceled, result: a }) => {
					ok(a);
				});
			});
		},
		out: (value) => {
			console.log(value);
		},
		log: (type, params) => {
		},
	});

	initPlugin({ plugin, aiscript });

	const parser = new Parser();

	aiscript.exec(parser(plugin.ast));
}

function createPluginEnv(opts) {
	const config = new Map();
	for (const [k, v] of Object.entries(opts.plugin.config || {})) {
		// @ts-ignore
		config.set(k, utils.jsToVal(typeof opts.plugin.configData[k] !== 'undefined' ? opts.plugin.configData[k] : v.default));
	}

	return {
		...createAiScriptEnv({ ...opts, token: opts.plugin.token }),
		//#region Deprecated
		'Mk:register_post_form_action': values.FN_NATIVE(([title, handler]) => {
			registerPostFormAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Mk:register_user_action': values.FN_NATIVE(([title, handler]) => {
			registerUserAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Mk:register_note_action': values.FN_NATIVE(([title, handler]) => {
			registerNoteAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		//#endregion
		'Plugin:register_post_form_action': values.FN_NATIVE(([title, handler]) => {
			registerPostFormAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_user_action': values.FN_NATIVE(([title, handler]) => {
			registerUserAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_note_action': values.FN_NATIVE(([title, handler]) => {
			registerNoteAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_note_view_interruptor': values.FN_NATIVE(([handler]) => {
			registerNoteViewInterruptor({ pluginId: opts.plugin.id, handler });
		}),
		'Plugin:register_note_post_interruptor': values.FN_NATIVE(([handler]) => {
			registerNotePostInterruptor({ pluginId: opts.plugin.id, handler });
		}),
		'Plugin:open_url': values.FN_NATIVE(([url]) => {
			window.open(url.value, '_blank');
		}),
		'Plugin:config': values.OBJ(config),
	};
}

function initPlugin({ plugin, aiscript }) {
	pluginContexts.set(plugin.id, aiscript);
}

function registerPostFormAction({ pluginId, title, handler }) {
	// @ts-ignore
	postFormActions.push({
		// @ts-ignore
		title, handler: (form, update) => {
			// @ts-ignore
			pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(form), values.FN_NATIVE(([key, value]) => {
				// @ts-ignore
				update(key.value, value.value);
			})]);
		},
	});
}

function registerUserAction({ pluginId, title, handler }) {
	// @ts-ignore
	userActions.push({
		// @ts-ignore
		title, handler: (user) => {
			// @ts-ignore
			pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(user)]);
		},
	});
}

function registerNoteAction({ pluginId, title, handler }) {
	// @ts-ignore
	noteActions.push({
		title, handler: (note) => {
			// @ts-ignore
			pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(note)]);
		},
	});
}

function registerNoteViewInterruptor({ pluginId, handler }) {
	// @ts-ignore
	noteViewInterruptors.push({
		// @ts-ignore
		handler: async (note) => {
			// @ts-ignore
			return utils.valToJs(await pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(note)]));
		},
	});
}

function registerNotePostInterruptor({ pluginId, handler }) {
	// @ts-ignore
	notePostInterruptors.push({
		// @ts-ignore
		handler: async (note) => {
			return utils.valToJs(await pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(note)]));
		},
	});
}
