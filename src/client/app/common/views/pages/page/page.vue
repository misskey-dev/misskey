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
import { AiScript } from '../../../scripts/aiscript';

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
			compiler: null,
			faPlus, faICursor, faSave, faStickyNote, faSquareRootAlt
		};
	},

	created() {
		this.root = this;
		this.$root.api('pages/show', {
			pageId: this.pageId,
		}).then(page => {
			this.page = page;
			this.compiler = new AiScript(this.page.variables);
			this.calcVariables();
		});
	},

	methods: {
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
			const bin = this.compiler.compile(v);
			console.log('Complied:', bin);
			try {
				return this.compiler.evaluateExpression(bin);
			} catch(e) {
				this.$root.dialog({
					type: 'error',
					text: e.toString()
				});
			}
		},
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
