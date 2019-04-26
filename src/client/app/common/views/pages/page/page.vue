<template>
<div class="iroscrza">
	<template v-if="page">
		<header>
			<div class="title">{{ page.title }}</div>
		</header>

		<template v-for="child in page.content">
			<component :is="'x-' + child.type" :value="child" :root="root" :key="child.id"/>
		</template>
	</template>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { faICursor, faPlus, faSquareRootAlt } from '@fortawesome/free-solid-svg-icons';
import { faSave, faStickyNote } from '@fortawesome/free-regular-svg-icons';
import XSection from './page.section.vue';
import XText from './page.text.vue';
import XImage from './page.image.vue';
import XButton from './page.button.vue';

export default Vue.extend({
	i18n: i18n(),

	components: {
		XSection, XText, XImage, XButton
	},

	props: {
		pageId: {
			type: String,
			required: false
		}
	},

	data() {
		return {
			root: null,
			page: null,
			variables: [],
			faPlus, faICursor, faSave, faStickyNote, faSquareRootAlt
		};
	},

	created() {
		this.root = this;
		this.$root.api('pages/show', {
			pageId: this.pageId,
		}).then(page => {
			this.page = page;
			this.calcVariables();
		});
	},

	methods: {
		getVariableValue(name) {
			const v = this.variables.find(v => v.name === name);
			if (v) {
				return v.value;
			} else {
				this.$root.dialog({
					type: 'error',
					text: `Script: No such variable '${name}'`
				});
				throw new Error();
			}
		},

		calcVariables() {
			this.variables = [];
			for (const v of this.page.variables) {
				this.variables.push({
					name: v.name,
					value: this.evaluateVariable(v)
				});
			}
		},

		evaluateVariable(v) {
			console.log('Complied:', this.complie(v));
			return this.evaluateFormula(this.complie(v));
		},

		complie(v): string {
			if (v.type === 'formula') {
				return v.value;
			} else if (v.type === 'text') {
				return '"' + v.value + '"'; // todo escape
			} else if (v.type === 'multiLineText') {
				return '"' + v.value + '"'; // todo escape
			} else if (v.type === 'if') {
				return `if(${this.complie(v.x)}, ${this.complie(v.a)}, ${this.complie(v.b)})`;
			}
		},

		evaluateFormula(formula) {
			console.log(formula);

			const num = formula.trim().match(/^[0-9]+$/);
			if (num) {
				return parseInt(num[0], 10);
			}

			const str = formula.trim().match(/^"(.+?)"$/);
			if (str) {
				return str[0].slice(1, -1);
			}

			const variable = formula.trim().match(/^[a-zA-Z]+$/);
			if (variable) {
				return this.getVariableValue(variable[0]);
			}

			const funcName = formula.substr(0, formula.indexOf('('));
			const argsPart = formula.substr(formula.indexOf('(')).slice(1, -1);

			const args = [];

			let argFormula = '';
			let pendingOpenBrackets = 0;
			for (let i = 0; i < argsPart.length; i++) {
				const char = argsPart[i];
				if (char === ',' && pendingOpenBrackets === 0) {
					args.push(this.evaluateFormula(argFormula));
					i++;
					argFormula = '';
					continue;
				} else if (char === '(') {
					pendingOpenBrackets++;
				} else if (char === ')') {
					pendingOpenBrackets--;
				}
				argFormula += char;
			}
			if (argFormula.length > 0) {
				args.push(this.evaluateFormula(argFormula));
			}

			const funcs = {
				eq: (a, b) => a === b,
				if: (bool, a, b) => bool ? a : b,
				random: (min, max) => min + Math.floor(Math.random() * (max - min + 1))
			};

			const res = funcs[funcName](...args);

			console.log(funcName, args, res);

			return res;
		},

		interpolate(str: string) {
			return str.replace(/\{\{\{(.+?)\}\}\}/g, match => this.getVariableValue(match.slice(3, -3).trim()).toString());
		}
	}
});
</script>

<style lang="stylus" scoped>
.iroscrza
	overflow hidden
	background var(--face)

	&.round
		border-radius 6px

	&.shadow
		box-shadow 0 3px 8px rgba(0, 0, 0, 0.2)

	> header
		background var(--faceHeader)

		> .title
			z-index 1
			margin 0
			padding 0 16px
			line-height 42px
			font-size 0.9em
			font-weight bold
			color var(--faceHeaderText)
			box-shadow 0 var(--lineWidth) rgba(#000, 0.07)

			> [data-icon]
				margin-right 6px

			&:empty
				display none

</style>
