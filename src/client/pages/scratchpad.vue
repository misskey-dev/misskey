<template>
<div class="">
	<div class="_panel iltifgqe">
		<PrismEditor class="_code code" v-model="code" :highlight="highlighter" :line-numbers="false"/>
		<MkButton style="position: absolute; top: 8px; right: 8px;" @click="run()" primary><Fa :icon="faPlay"/></MkButton>
	</div>

	<MkContainer :body-togglable="true">
		<template #header><Fa fixed-width/>{{ $t('output') }}</template>
		<div class="bepmlvbi">
			<div v-for="log in logs" class="log" :key="log.id" :class="{ print: log.print }">{{ log.text }}</div>
		</div>
	</MkContainer>

	<section class="_section" style="margin-top: var(--margin);">
		<div class="_content">{{ $t('scratchpadDescription') }}</div>
	</section>
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
import MkContainer from '@/components/ui/container.vue';
import MkButton from '@/components/ui/button.vue';
import { createAiScriptEnv } from '@/scripts/aiscript/api';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkContainer,
		MkButton,
		PrismEditor,
	},

	data() {
		return {
			INFO: {
				title: this.$t('scratchpad'),
				icon: faTerminal,
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
	position: relative;

	> .code {
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
