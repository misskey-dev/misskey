<template>
<div class="iroscrza" :class="{ center: page.alignCenter, serif: page.font === 'serif' }" v-if="script">
	<x-block v-for="child in page.content" :value="child" @input="v => updateBlock(v)" :page="page" :script="script" :key="child.id" :h="2"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import { faHeart as faHeartS } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import XBlock from './page.block.vue';
import { ASEvaluator } from '../../scripts/aiscript/evaluator';
import { collectPageVars } from '../../scripts/collect-page-vars';
import { url } from '../../config';

class Script {
	public aiScript: ASEvaluator;
	private onError: any;
	public vars: Record<string, any>;
	public page: Record<string, any>;

	constructor(page, aiScript, onError) {
		this.page = page;
		this.aiScript = aiScript;
		this.onError = onError;
		this.eval();
	}

	public eval() {
		try {
			this.vars = this.aiScript.evaluateVars();
		} catch (e) {
			this.onError(e);
		}
	}

	public interpolate(str: string) {
		if (str == null) return null;
		return str.replace(/{(.+?)}/g, match => {
			const v = this.vars[match.slice(1, -1).trim()];
			return v == null ? 'NULL' : v.toString();
		});
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
		this.script = new Script(this.page, new ASEvaluator(this.page.variables, pageVars, {
			randomSeed: Math.random(),
			user: this.page.user,
			visitor: this.$store.state.i,
			page: this.page,
			url: url
		}), e => {
			console.dir(e);
		});
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

	> header {
		> .title {
			z-index: 1;
			margin: 0;
			padding: 16px 32px;
			font-size: 20px;
			font-weight: bold;
			color: var(--text);
			box-shadow: 0 var(--lineWidth) rgba(#000, 0.07);

			@media (max-width: 600px) {
				padding: 16px 32px;
				font-size: 20px;
			}

			@media (max-width: 400px) {
				padding: 10px 20px;
				font-size: 16px;
			}
		}
	}

	> div {
		color: var(--text);
		padding: 24px 32px;
		font-size: 16px;

		@media (max-width: 600px) {
			padding: 24px 32px;
			font-size: 16px;
		}

		@media (max-width: 400px) {
			padding: 20px 20px;
			font-size: 15px;
		}
	}

	> footer {
		color: var(--text);
		padding: 0 32px 28px 32px;

		@media (max-width: 600px) {
			padding: 0 32px 28px 32px;
		}

		@media (max-width: 400px) {
			padding: 0 20px 20px 20px;
			font-size: 14px;
		}

		> small {
			display: block;
			opacity: 0.5;
		}

		> a {
			font-size: 90%;
		}

		> a + a {
			margin-left: 8px;
		}

		> .like {
			margin-top: 16px;
		}
	}
}
</style>
