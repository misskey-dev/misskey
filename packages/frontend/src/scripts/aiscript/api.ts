import { utils, values } from '@syuilo/aiscript';
import { defineAsyncComponent } from 'vue';
import { permissions as MkPermissions } from 'misskey-js';
import * as os from '@/os';
import { $i } from '@/account';
import { miLocalStorage } from '@/local-storage';
import { customEmojis } from '@/custom-emojis';

export function createAiScriptEnv(opts) {
	let apiRequests = 0;
	const table = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	const randomString = Array.from(crypto.getRandomValues(new Uint32Array(32)))
		.map(v => table[v % table.length])
		.join('');
	return {
		USER_ID: $i ? values.STR($i.id) : values.NULL,
		USER_NAME: $i ? values.STR($i.name) : values.NULL,
		USER_USERNAME: $i ? values.STR($i.username) : values.NULL,
		CUSTOM_EMOJIS: utils.jsToVal(customEmojis.value),
		CURRENT_URL: values.STR(window.location.href),
		'Mk:dialog': values.FN_NATIVE(async ([title, text, type]) => {
			await os.alert({
				type: type ? type.value : 'info',
				title: title.value,
				text: text.value,
			});
			return values.NULL;
		}),
		'Mk:confirm': values.FN_NATIVE(async ([title, text, type]) => {
			const confirm = await os.confirm({
				type: type ? type.value : 'question',
				title: title.value,
				text: text.value,
			});
			return confirm.canceled ? values.FALSE : values.TRUE;
		}),
		'Mk:api': values.FN_NATIVE(async ([ep, param, token]) => {
			if (token) {
				utils.assertString(token);
				// バグがあればundefinedもあり得るため念のため
				if (typeof token.value !== 'string') throw new Error('invalid token');
			}
			apiRequests++;
			if (apiRequests > 16) return values.NULL;
			const res = await os.api(ep.value, utils.valToJs(param), token ? token.value : miLocalStorage.getItem(`aiscriptSecure:${opts.storageKey}:${randomString}:accessToken`) ?? (opts.token ?? null));
			return utils.jsToVal(res);
		}),
		'Mk:save': values.FN_NATIVE(([key, value]) => {
			utils.assertString(key);
			miLocalStorage.setItem(`aiscript:${opts.storageKey}:${key.value}`, JSON.stringify(utils.valToJs(value)));
			return values.NULL;
		}),
		'Mk:load': values.FN_NATIVE(([key]) => {
			utils.assertString(key);
			return utils.jsToVal(JSON.parse(miLocalStorage.getItem(`aiscript:${opts.storageKey}:${key.value}`)));
		}),
		'Mk:requestToken': values.FN_NATIVE(async ([value]) => {
			utils.assertArray(value);
			const permissions = (utils.valToJs(value) as unknown[]).map(val => {
				if (typeof val !== 'string') {
					throw new Error(`Invalid type. expected string but got ${typeof val}`);
				}
				return val;
			}).filter(val => MkPermissions.includes(val));
			return await new Promise(async (resolve: any) => {
				await os.popup(defineAsyncComponent(() => import('@/components/MkFlashRequestTokenDialog.vue')), {
					permissions,
				}, {
					accept: () => {
						os.api('flash/gen-token', {
							permissions,
						}).then(res => {
							miLocalStorage.setItem(`aiscriptSecure:${opts.storageKey}:${randomString}:accessToken`, res!.token);
							resolve(values.TRUE);
						});
					},
					cancel: () => resolve(values.FALSE),
					closed: () => {
						resolve(values.FALSE);
					},
				}, 'closed');
			});
		}),
	};
}
