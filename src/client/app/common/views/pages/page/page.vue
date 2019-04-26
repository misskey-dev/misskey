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
			if (v.type === 'expression') {
				return v.value;
			} else if (v.type === 'text') {
				return '"' + v.value + '"'; // todo escape
			} else if (v.type === 'multiLineText') {
				return '"' + v.value + '"'; // todo escape
			} else if (v.type === 'number') {
				return parseInt(v.value, 10);
			} else if (v.type === 'if') {
				return `if(${this.complie(v.args[0])}, ${this.complie(v.args[1])}, ${this.complie(v.args[2])})`;
			} else if (v.type === 'eq') {
				return `eq(${this.complie(v.args[0])}, ${this.complie(v.args[1])})`;
			} else if (v.type === 'gt') {
				return `gt(${this.complie(v.args[0])}, ${this.complie(v.args[1])})`;
			} else if (v.type === 'lt') {
				return `lt(${this.complie(v.args[0])}, ${this.complie(v.args[1])})`;
			} else if (v.type === 'gtOrEq') {
				return `gt_eq(${this.complie(v.args[0])}, ${this.complie(v.args[1])})`;
			} else if (v.type === 'ltOrEq') {
				return `lt_eq(${this.complie(v.args[0])}, ${this.complie(v.args[1])})`;
			} else if (v.type === 'not') {
				return `not(${this.complie(v.args[0])})`;
			} else if (v.type === 'random') {
				return `random(${this.complie(v.args[0])}, ${this.complie(v.args[1])})`;
			}

			console.warn('Unknown type:', v.type);
		},

		evaluateFormula(expression) {
			console.log(expression);

			const num = expression.trim().match(/^[0-9]+$/);
			if (num) {
				return parseInt(num[0], 10);
			}

			const str = expression.trim().match(/^"(.+?)"$/);
			if (str) {
				return this.interpolate(str[0].slice(1, -1));
			}

			const variable = expression.trim().match(/^[a-zA-Z]+$/);
			if (variable) {
				return this.getVariableValue(variable[0]);
			}

			const funcName = expression.substr(0, expression.indexOf('('));
			const argsPart = expression.substr(expression.indexOf('(')).slice(1, -1);

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
				not: (a) => !a,
				eq: (a, b) => a === b,
				gt: (a, b) => a > b,
				lt: (a, b) => a < b,
				gt_eq: (a, b) => a >= b,
				lt_eq: (a, b) => a <= b,
				if: (bool, a, b) => bool ? a : b,
				random: (min, max) => min + Math.floor(Math.random() * (max - min + 1))
			};

			const res = funcs[funcName](...args);

			console.log(funcName, args, res);

			return res;
		},

		interpolate(str: string) {
			return str.replace(/\{(.+?)\}/g, match => this.getVariableValue(match.slice(1, -1).trim()).toString());
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
