import { utils, values } from '@syuilo/aiscript';

export function createAiScriptEnv(vm) {
	return {
		USER_ID: values.STR(vm.$store.state.i.id),
		USER_USERNAME: values.STR(vm.$store.state.i.username),
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
			return confirm.canceled ? values.FALSE : values.TRUE
		}),
		'Mk:api': values.FN_NATIVE(async ([ep, param, token]) => {
			const res = await vm.$root.api(ep.value, utils.valToJs(param), token || null);
			return utils.jsToVal(res);
		}),
	};
}
