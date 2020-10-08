import { AiScript } from '@syuilo/aiscript';
import { deserialize } from '@syuilo/aiscript/built/serializer';
import { createPluginEnv } from '@/scripts/aiscript/api';
import { dialog } from '@/os';
import { store } from '@/store';

export function install(plugin) {
	console.info('Plugin installed:', plugin.name, 'v' + plugin.version);

	const aiscript = new AiScript(createPluginEnv({
		plugin: plugin,
		storageKey: 'plugins:' + plugin.id
	}), {
		in: (q) => {
			return new Promise(ok => {
				dialog({
					title: q,
					input: {}
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

	store.commit('initPlugin', { plugin, aiscript });

	aiscript.exec(deserialize(plugin.ast));
}
