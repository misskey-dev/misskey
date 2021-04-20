<template>
<div class="iltifgqe">
	<div class="editor _panel _gap">
		<PrismEditor class="_code code" v-model="code" :highlight="highlighter" :line-numbers="false"/>
		<MkButton style="position: absolute; top: 8px; right: 8px;" @click="run()" primary><i class="fas fa-play"></i></MkButton>
	</div>

	<MkContainer :foldable="true" class="_gap">
		<template #header>{{ $ts.output }}</template>
		<div class="bepmlvbi">
			<div v-for="log in logs" class="log" :key="log.id" :class="{ print: log.print }">{{ log.text }}</div>
		</div>
	</MkContainer>

	<div class="_gap">
		{{ $ts.scratchpadDescription }}
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTerminal, faPlay } from '@fortawesome/free-solid-svg-icons';
import 'prismjs';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-okaidia.css';
import { PrismEditor } from 'vue-prism-editor';
import 'vue-prism-editor/dist/prismeditor.min.css';
import { AiScript, parse, utils, values } from '@syuilo/aiscript';
import MkContainer from '@client/components/ui/container.vue';
import MkButton from '@client/components/ui/button.vue';
import { createAiScriptEnv } from '@client/scripts/aiscript/api';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkContainer,
		MkButton,
		PrismEditor,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.scratchpad,
				icon: 'fas fa-terminal',
			},
			code: '',
			logs: [],
			faTerminal, faPlay
		}
	},

	watch: {
		code() {
			localStorage.setItem('scratchpad', this.code);
		}
	},

	created() {
		const saved = localStorage.getItem('scratchpad');
		if (saved) {
			this.code = saved;
		}
	},

	methods: {
		async run() {
			this.logs = [];
			const aiscript = new AiScript(createAiScriptEnv({
				storageKey: 'scratchpad',
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
				ast = parse(this.code);
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

		highlighter(code) {
			return highlight(code, languages.js, 'javascript');
		},
	}
});
</script>

<style lang="scss" scoped>
.iltifgqe {
	padding: 16px;

	> .editor {
		position: relative;
	}
}

.bepmlvbi {
	padding: 16px;

	> .log {
		&:not(.print) {
			opacity: 0.7;
		}
	}
}
</style>
