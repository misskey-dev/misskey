<template>
<div v-if="page" class="iroscrza" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners, fontFamily: page.font }">
	<header>
		<div class="title">{{ page.title }}</div>
	</header>

	<div>
		<template v-for="child in page.content">
			<component :is="'x-' + child.type" :value="child" :page="page" :script="script" :key="child.id" :h="2"/>
		</template>
	</div>
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

class Script {
	public aiScript: AiScript;
	public vars: any;

	constructor(aiScript) {
		this.aiScript = aiScript;
		this.vars = this.aiScript.evaluateVars();
	}

	public reEval() {
		this.vars = this.aiScript.evaluateVars();
	}

	public interpolate(str: string) {
		return str.replace(/\{(.+?)\}/g, match => this.vars.find(x => x.name === match.slice(1, -1).trim()).value.toString());
	}
}

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
			page: null,
			script: null,
			faPlus, faICursor, faSave, faStickyNote, faSquareRootAlt
		};
	},

	created() {
		this.$root.api('pages/show', {
			pageId: this.pageId,
		}).then(page => {
			this.page = page;
			this.script = new Script(new AiScript(this.page.variables));
		});
	},
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
			padding 32px 64px
			font-size 24px
			font-weight bold
			color var(--faceHeaderText)
			box-shadow 0 var(--lineWidth) rgba(#000, 0.07)

			> [data-icon]
				margin-right 6px

			&:empty
				display none

	> div
		padding 48px 64px
		color var(--text)
		font-size 18px

</style>
