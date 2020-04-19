<template>
<div class="">
	<portal to="icon"><fa :icon="faTerminal"/></portal>
	<portal to="title">{{ $t('scratchpad') }}</portal>

	<div class="_panel">
		<prism-editor v-model="code" :line-numbers="false" language="js"/>
		<mk-button style="position: absolute; top: 8px; right: 8px;" @click="run()" primary><fa :icon="faPlay"/></mk-button>
	</div>

	<mk-container :body-togglable="true">
		<template #header><fa fixed-width/>{{ $t('output') }}</template>
		<div class="bepmlvbi">
			<div v-for="log in logs" class="log" :key="log.id" :class="{ print: log.print }">{{ log.text }}</div>
		</div>
	</mk-container>

	<section class="_card" style="margin-top: var(--margin);">
		<div class="_content">{{ $t('scratchpadDescription') }}</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faTerminal, faPlay } from '@fortawesome/free-solid-svg-icons';
import "prismjs";
import 'prismjs/themes/prism-okaidia.css';
import PrismEditor from 'vue-prism-editor';
import { AiScript, parse, utils, values } from '@syuilo/aiscript';
import i18n from '../i18n';
import MkContainer from '../components/ui/container.vue';
import MkButton from '../components/ui/button.vue';
import { createAiScriptEnv } from '../scripts/create-aiscript-env';

export default Vue.extend({
	i18n,

	metaInfo() {
		return {
			title: this.$t('scratchpad') as string
		};
	},

	components: {
		MkContainer,
		MkButton,
		PrismEditor,
	},

	data() {
		return {
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
			const aiscript = new AiScript(createAiScriptEnv(this, {
				storageKey: 'scratchpad'
			}), {
				in: (q) => {
					return new Promise(ok => {
						this.$root.dialog({
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
				this.$root.dialog({
					type: 'error',
					text: 'Syntax error :('
				});
				return;
			}
			try {
				await aiscript.exec(ast);
			} catch (e) {
				this.$root.dialog({
					type: 'error',
					text: e
				});
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.bepmlvbi {
	padding: 16px;

	> .log {
		&:not(.print) {
			opacity: 0.7;
		}
	}
}
</style>
