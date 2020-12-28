<template>
<div class="mkw-button">
	<MkButton :primary="props.colored" full @click="run">
		{{ props.label }}
	</MkButton>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import define from './define';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { AiScript, parse, utils } from '@syuilo/aiscript';
import { createAiScriptEnv } from '@/scripts/aiscript/api';

const widget = define({
	name: 'button',
	props: () => ({
		label: {
			type: 'string',
			default: 'BUTTON',
		},
		colored: {
			type: 'boolean',
			default: true,
		},
		script: {
			type: 'string',
			multiline: true,
			default: 'Mk:dialog("hello" "world")',
		},
	})
});

export default defineComponent({
	components: {
		MkButton
	},
	extends: widget,
	data() {
		return {
		};
	},
	methods: {
		async run() {
			const aiscript = new AiScript(createAiScriptEnv({
				storageKey: 'scratchpad'
			}), {
				in: (q) => {
					return new Promise(ok => {
						os.dialog({
							title: q,
							input: {}
						}).then(({ canceled, result: a }) => {
							ok(a);
						});
					});
				},
				out: (value) => {
					// nop
				},
				log: (type, params) => {
					// nop
				}
			});

			let ast;
			try {
				ast = parse(this.props.script);
			} catch (e) {
				os.dialog({
					type: 'error',
					text: 'Syntax error :('
				});
				return;
			}
			try {
				await aiscript.exec(ast);
			} catch (e) {
				os.dialog({
					type: 'error',
					text: e
				});
			}
		},
	}
});
</script>

<style lang="scss" scoped>
.mkw-button {
}
</style>
