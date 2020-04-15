<template>
<div class="iroscrza" :class="{ center: page.alignCenter, serif: page.font === 'serif' }" v-if="script">
	<x-block v-for="child in page.content" :value="child" @input="v => updateBlock(v)" :page="page" :script="script" :key="child.id" :h="2"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { AiScript, parse, values } from '@syuilo/aiscript';
import { faHeart as faHeartS } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import i18n from '../../i18n';
import XBlock from './page.block.vue';
import { ASEvaluator } from '../../scripts/aoiscript/evaluator';
import { collectPageVars } from '../../scripts/collect-page-vars';
import { url } from '../../config';

class Script {
	public aoiScript: ASEvaluator;
	private onError: any;
	public vars: Record<string, any>;
	public page: Record<string, any>;

	constructor(page, aoiScript, onError) {
		this.page = page;
		this.aoiScript = aoiScript;
		this.onError = onError;
		this.eval();
	}

	public eval() {
		try {
			this.vars = this.aoiScript.evaluateVars();
		} catch (e) {
			this.onError(e);
		}
	}

	public interpolate(str: string) {
		if (str == null) return null;
		return str.replace(/{(.+?)}/g, match => {
			const v = this.vars ? this.vars[match.slice(1, -1).trim()] : null;
			return v == null ? 'NULL' : v.toString();
		});
	}

	public callAiScript(fn: string) {
		try {
			if (this.aoiScript.aiscript) this.aoiScript.aiscript.execFn(this.aoiScript.aiscript.scope.get(fn), []);
		} catch (e) {}
	}
}

export default Vue.extend({
	i18n,

	components: {
		XBlock
	},

	props: {
		page: {
			type: Object,
			required: true
		},
	},

	data() {
		return {
			script: null,
			faHeartS, faHeart
		};
	},

	created() {
		const pageVars = this.getPageVars();
		
		this.script = new Script(this.page, new ASEvaluator(this, this.page.variables, pageVars, {
			randomSeed: Math.random(),
			visitor: this.$store.state.i,
			page: this.page,
			url: url,
			enableAiScript: !this.$store.state.device.disablePagesScript
		}), e => {
			console.dir(e);
		});

		if (this.script.aoiScript.aiscript) this.script.aoiScript.aiscript.scope.opts.onUpdated = (name, value) => {
			this.script.eval();
		};
	},

	mounted() {
		this.$nextTick(() => {
			if (this.script.page.script && this.script.aoiScript.aiscript) {
				let ast;
				try {
					ast = parse(this.script.page.script);
				} catch (e) {
					console.error(e);
					/*this.$root.dialog({
						type: 'error',
						text: 'Syntax error :('
					});*/
					return;
				}
				this.script.aoiScript.aiscript.exec(ast).then(() => {
					this.script.eval();
				}).catch(e => {
					console.error(e);
					/*this.$root.dialog({
						type: 'error',
						text: e
					});*/
				});
			} else {
				this.script.eval();
			}
		});
	},

	beforeDestroy() {
		if (this.script.aoiScript.aiscript) this.script.aoiScript.aiscript.abort();
	},

	methods: {
		getPageVars() {
			return collectPageVars(this.page.content);
		},
	}
});
</script>

<style lang="scss" scoped>
.iroscrza {
	&.serif {
		> div {
			font-family: serif;
		}
	}

	&.center {
		text-align: center;
	}
}
</style>
