<template>
<div class="pptjhabgjtt7kwskbfv4y3uml6fpuhmr">
	<h1>{{ this.$t('share-with', { name }) }}</h1>
	<div>
		<mk-signin v-if="!$store.getters.isSignedIn"/>
		<mk-post-form v-else-if="!posted" :initial-text="template" :instant="true" @posted="posted = true"/>
		<p v-if="posted" class="posted"><fa icon="check"/></p>
	</div>
	<button v-if="posted" class="ui button" @click="close">{{ $t('@.close') }}</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/share.vue'),
	data() {
		return {
			name: null,
			posted: false,
			text: new URLSearchParams(location.search).get('text'),
			url: new URLSearchParams(location.search).get('url'),
			title: new URLSearchParams(location.search).get('title'),
		};
	},
	computed: {
		template(): string {
			let t = '';
			if (this.title && this.url) t += `【[${title}](${url})】\n`;
			if (this.title && !this.url) t += `【${title}】\n`;
			if (this.text) t += `${text}\n`;
			if (!this.title && this.url) t += `${url}`;
			return t.trim();
		}
	},
	methods: {
		close() {
			window.close();
		}
	},
	mounted() {
		this.$root.getMeta().then(meta => {
			this.name = meta.name;
		});
	}
});
</script>

<style lang="stylus" scoped>
.pptjhabgjtt7kwskbfv4y3uml6fpuhmr
	padding 16px

	> h1
		margin 0 0 8px 0
		color #555
		font-size 20px
		text-align center

	> div
		max-width 500px
		margin 0 auto
		background #fff
		border solid 1px rgba(#000, 0.1)
		border-radius 6px
		overflow hidden

		> .posted
			display block
			margin 0
			padding 64px
			text-align center

	> button
		display block
		margin 16px auto
</style>
