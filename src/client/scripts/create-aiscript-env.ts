import { utils, values } from '@syuilo/aiscript';

export function createAiScriptEnv(vm, opts) {
	let apiRequests = 0;
	return {
		USER_ID: vm.$store.getters.isSignedIn ? values.STR(vm.$store.state.i.id) : values.NULL,
		USER_NAME: vm.$store.getters.isSignedIn ? values.STR(vm.$store.state.i.name) : values.NULL,
		USER_USERNAME: vm.$store.getters.isSignedIn ? values.STR(vm.$store.state.i.username) : values.NULL,
		'Mk:dialog': values.FN_NATIVE(async ([title, text, type]) => {
			await vm.$root.dialog({
				type: type ? type.value : 'info',
				title: title.value,
				text: text.value,
			});
		}),
		'Mk:confirm': values.FN_NATIVE(async ([title, text]) => {
			const confirm = await vm.$root.dialog({
				type: 'warning',
				showCancelButton: true,
				title: title.value,
				text: text.value,
			});
			return confirm.canceled ? values.FALSE : values.TRUE;
		}),
		'Mk:api': values.FN_NATIVE(async ([ep, param, token]) => {
			apiRequests++;
			if (apiRequests > 16) return values.NULL;
			const res = await vm.$root.api(ep.value, utils.valToJs(param), token || null);
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
