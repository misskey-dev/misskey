<template>
<MkContainer :show-header="props.showHeader">
	<template #header><i class="fas fa-terminal"></i>{{ $ts._widgets.aiscript }}</template>

	<div class="uylguesu _monospace">
		<textarea v-model="props.script" placeholder="(1 + 1)"></textarea>
		<button @click="run" class="_buttonPrimary">RUN</button>
		<div class="logs">
			<div v-for="log in logs" class="log" :key="log.id" :class="{ print: log.print }">{{ log.text }}</div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTerminal } from '@fortawesome/free-solid-svg-icons';
import MkContainer from '@client/components/ui/container.vue';
import define from './define';
import * as os from '@client/os';
import { AiScript, parse, utils } from '@syuilo/aiscript';
import { createAiScriptEnv } from '@client/scripts/aiscript/api';

const widget = define({
	name: 'aiscript',
	props: () => ({
		showHeader: {
			type: 'boolean',
			default: true,
		},
		script: {
			type: 'string',
			multiline: true,
			default: '(1 + 1)',
			hidden: true,
		},
	})
});

export default defineComponent({
	extends: widget,
	components: {
		MkContainer
	},

	data() {
		return {
			logs: [],
			faTerminal
		};
	},

	methods: {
		async run() {
			this.logs = [];
			const aiscript = new AiScript(createAiScriptEnv({
				storageKey: 'widget',
				token: this.$i?.token,
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
					this.logs.push({
						id: Math.random(),
						text: value.type === 'str' ? value.value : utils.valToString(value),
						print: true
					});
				},
				log: (type, params) => {
					switch (type) {
						case 'end': this.logs.push({
							id: Math.random(),
							text: utils.valToString(params.val, true),
							print: false
						}); break;
						default: break;
					}
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
.uylguesu {
	text-align: right;

	> textarea {
		display: block;
		width: 100%;
		max-width: 100%;
		min-width: 100%;
		padding: 16px;
		color: var(--fg);
		background: transparent;
		border: none;
		border-bottom: solid 0.5px var(--divider);
		border-radius: 0;
		box-sizing: border-box;
		font: inherit;

		&:focus {
			outline: none;
		}
	}

	> button {
		display: inline-block;
		margin: 8px;
		padding: 0 10px;
		height: 28px;
		outline: none;
		border-radius: 4px;

		&:disabled {
			opacity: 0.7;
			cursor: default;
		}
	}

	> .logs {
		border-top: solid 0.5px var(--divider);
		text-align: left;
		padding: 16px;

		&:empty {
			display: none;
		}

		> .log {
			&:not(.print) {
				opacity: 0.7;
			}
		}
	}
}
</style>
