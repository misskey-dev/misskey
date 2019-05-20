<template>
<div class="azibmfpleajagva420swmu4c3r7ni7iw">
	<h1>{{ $t('share-with', { name }) }}</h1>
	<div>
		<mk-signin v-if="!$store.getters.isSignedIn"/>
		<x-post-form v-else-if="!posted" :initial-text="template" :instant="true" @posted="posted = true"/>
		<p v-if="posted" class="posted"><fa icon="check"/></p>
	</div>
	<ui-button class="close" v-if="posted" @click="close">{{ $t('@.close') }}</ui-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/share.vue'),
	components: {
		XPostForm: () => import('../../../desktop/views/components/post-form.vue').then(m => m.default)
	},
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
			if (this.title && this.url) t += `【[${this.title}](${this.url})】\n`;
			if (this.title && !this.url) t += `【${this.title}】\n`;
			if (this.text) t += `${this.text}\n`;
			if (!this.title && this.url) t += `${this.url}`;
			return t.trim();
		}
	},
	mounted() {
		this.$root.getMeta().then(meta => {
			this.name = meta.name || 'Misskey';
		});
	},
	methods: {
		close() {
			window.close();
		}
	}
});
</script>

<style lang="stylus" scoped>
.azibmfpleajagva420swmu4c3r7ni7iw
	> h1
		margin 8px 0
		color #555
		font-size 20px
		text-align center

	> div
		max-width 500px
		margin 0 auto

		> .posted
			display block
			margin 0 auto
			padding 64px
			text-align center
			background #fff
			border-radius 6px
			width calc(100% - 32px)

	> .close
		display block
		margin 16px auto
		width calc(100% - 32px)
</style>
