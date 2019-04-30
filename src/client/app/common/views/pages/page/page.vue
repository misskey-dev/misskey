<template>
<div v-if="page" class="iroscrza" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners, center: page.alignCenter }" :style="{ fontFamily: page.font }">
	<header>
		<div class="title">{{ page.title }}</div>
	</header>

	<div v-if="script">
		<x-block v-for="child in page.content" :value="child" @input="v => updateBlock(v)" :page="page" :script="script" :key="child.id" :h="2"/>
	</div>

	<footer>
		<small>@{{ page.user.username }}</small>
		<router-link v-if="$store.getters.isSignedIn && $store.state.i.id === page.userId" :to="`/i/pages/edit/${page.id}`">{{ $t('edit-this-page') }}</router-link>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { faICursor, faPlus, faSquareRootAlt } from '@fortawesome/free-solid-svg-icons';
import { faSave, faStickyNote } from '@fortawesome/free-regular-svg-icons';
import XBlock from './page.block.vue';
import { AiScript } from '../../../scripts/aiscript';
import { collectPageVars } from '../../../scripts/collect-page-vars';
import { url } from '../../../../config';

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
		if (str == null) return null;
		return str.replace(/\{(.+?)\}/g, match => {
			const v = this.vars.find(x => x.name === match.slice(1, -1).trim()).value;
			return v == null ? 'NULL' : v.toString();
		});
	}
}

export default Vue.extend({
	i18n: i18n('pages'),

	components: {
		XBlock
	},

	props: {
		pageName: {
			type: String,
			required: true
		},
		username: {
			type: String,
			required: true
		},
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
			name: this.pageName,
			username: this.username,
		}).then(page => {
			this.page = page;
			const pageVars = this.getPageVars();
			this.script = new Script(new AiScript(this.page.variables, pageVars, {
				randomSeed: Math.random(),
				user: page.user,
				visitor: this.$store.state.i,
				page: page,
				url: url
			}));
		});
	},

	methods: {
		getPageVars() {
			return collectPageVars(this.page.content);
		},
	}
});
</script>

<style lang="stylus" scoped>
.iroscrza
	overflow hidden
	background var(--face)

	&.center
		text-align center

	&.round
		border-radius 6px

	&.shadow
		box-shadow 0 3px 8px rgba(0, 0, 0, 0.2)

	> header
		> .title
			z-index 1
			margin 0
			padding 32px 64px
			font-size 24px
			font-weight bold
			color var(--text)
			box-shadow 0 var(--lineWidth) rgba(#000, 0.07)

			@media (max-width 600px)
				padding 16px 32px
				font-size 20px

	> div
		color var(--text)
		padding 48px 64px
		font-size 18px

		@media (max-width 600px)
			padding 24px 32px
			font-size 16px

	> footer
		color var(--text)
		padding 0 64px 38px 64px

		@media (max-width 600px)
			padding 0 32px 28px 32px

		> small
			display block
			opacity 0.5

</style>
