<template>
<div class="mk-github-setting">
	<p>{{ $t('description') }}<a :href="`${docsUrl}/link-to-github`" target="_blank">{{ $t('detail') }}</a></p>
	<p class="account" v-if="$store.state.i.github" :title="`GitHub ID: ${$store.state.i.github.id}`">{{ $t('connected-to') }}: <a :href="`https://github.com/${$store.state.i.github.login}`" target="_blank">@{{ $store.state.i.github.login }}</a></p>
	<p>
		<a :href="`${apiUrl}/connect/github`" target="_blank" @click.prevent="connect">{{ $store.state.i.github ? this.$t('reconnect') : this.$t('connect') }}</a>
		<span v-if="$store.state.i.github"> or </span>
		<a :href="`${apiUrl}/disconnect/github`" target="_blank" v-if="$store.state.i.github" @click.prevent="disconnect">{{ $t('disconnect') }}</a>
	</p>
	<p class="id" v-if="$store.state.i.github">GitHub ID: {{ $store.state.i.github.id }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { apiUrl, docsUrl } from '../../../config';

export default Vue.extend({
	i18n: i18n('common/views/components/github-setting.vue'),
	data() {
		return {
			form: null,
			apiUrl,
			docsUrl
		};
	},
	mounted() {
		this.$watch('$store.state.i', () => {
			if (this.$store.state.i.github && this.form)
				this.form.close();
		}, {
			deep: true
		});
	},
	methods: {
		connect() {
			this.form = window.open(apiUrl + '/connect/github',
				'github_connect_window',
				'height=570, width=520');
		},

		disconnect() {
			window.open(apiUrl + '/disconnect/github',
				'github_disconnect_window',
				'height=570, width=520');
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-github-setting
	.account
		border solid 1px #e1e8ed
		border-radius 4px
		padding 16px

		a
			font-weight bold
			color inherit

	.id
		color #8899a6
</style>
