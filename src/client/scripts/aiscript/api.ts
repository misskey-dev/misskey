import { utils, values } from '@syuilo/aiscript';
import { jsToVal } from '@syuilo/aiscript/built/interpreter/util';
import { store } from '@/store';
import * as os from '@/os';

export function createAiScriptEnv(opts) {
	let apiRequests = 0;
	return {
		USER_ID: store.getters.isSignedIn ? values.STR(store.state.i.id) : values.NULL,
		USER_NAME: store.getters.isSignedIn ? values.STR(store.state.i.name) : values.NULL,
		USER_USERNAME: store.getters.isSignedIn ? values.STR(store.state.i.username) : values.NULL,
		'Mk:dialog': values.FN_NATIVE(async ([title, text, type]) => {
			await os.dialog({
				type: type ? type.value : 'info',
				title: title.value,
				text: text.value,
			});
		}),
		'Mk:confirm': values.FN_NATIVE(async ([title, text, type]) => {
			const confirm = await os.dialog({
				type: type ? type.value : 'question',
				showCancelButton: true,
				title: title.value,
				text: text.value,
			});
			return confirm.canceled ? values.FALSE : values.TRUE;
		}),
		'Mk:api': values.FN_NATIVE(async ([ep, param, token]) => {
			if (token) utils.assertString(token);
			apiRequests++;
			if (apiRequests > 16) return values.NULL;
			const res = await os.api(ep.value, utils.valToJs(param), token ? token.value : (opts.token || null));
			return utils.jsToVal(res);
		}),
		'Mk:save': values.FN_NATIVE(([key, value]) => {
			utils.assertString(key);
			localStorage.setItem('aiscript:' + opts.storageKey + ':' + key.value, JSON.stringify(utils.valToJs(value)));
			return values.NULL;
		}),
		'Mk:load': values.FN_NATIVE(([key]) => {
			utils.assertString(key);
			return utils.jsToVal(JSON.parse(localStorage.getItem('aiscript:' + opts.storageKey + ':' + key.value)));
		}),
	};
}

export function createPluginEnv(opts) {
	const config = new Map();
	for (const [k, v] of Object.entries(opts.plugin.config || {})) {
		config.set(k, jsToVal(opts.plugin.configData[k] || v.default));
	}

	return {
		...createAiScriptEnv({ ...opts, token: opts.plugin.token }),
		//#region Deprecated
		'Mk:register_post_form_action': values.FN_NATIVE(([title, handler]) => {
			store.commit('registerPostFormAction', { pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Mk:register_user_action': values.FN_NATIVE(([title, handler]) => {
			store.commit('registerUserAction', { pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Mk:register_note_action': values.FN_NATIVE(([title, handler]) => {
			store.commit('registerNoteAction', { pluginId: opts.plugin.id, title: title.value, handler });
		}),
		//#endregion
		'Plugin:register_post_form_action': values.FN_NATIVE(([title, handler]) => {
			store.commit('registerPostFormAction', { pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_user_action': values.FN_NATIVE(([title, handler]) => {
			store.commit('registerUserAction', { pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_note_action': values.FN_NATIVE(([title, handler]) => {
			store.commit('registerNoteAction', { pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_note_view_interruptor': values.FN_NATIVE(([handler]) => {
			store.commit('registerNoteViewInterruptor', { pluginId: opts.plugin.id, handler });
		}),
		'Plugin:register_note_post_interruptor': values.FN_NATIVE(([handler]) => {
			store.commit('registerNotePostInterruptor', { pluginId: opts.plugin.id, handler });
		}),
		'Plugin:open_url': values.FN_NATIVE(([url]) => {
			window.open(url.value, '_blank');
		}),
		'Plugin:config': values.OBJ(config),
	};
}
