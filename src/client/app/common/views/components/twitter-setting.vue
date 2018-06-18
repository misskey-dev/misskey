<template>
<div class="mk-twitter-setting">
	<p>%i18n:@description%<a :href="`${docsUrl}/link-to-twitter`" target="_blank">%i18n:@detail%</a></p>
	<p class="account" v-if="$store.state.i.twitter" :title="`Twitter ID: ${$store.state.i.twitter.userId}`">%i18n:@connected-to%: <a :href="`https://twitter.com/${$store.state.i.twitter.screenName}`" target="_blank">@{{ $store.state.i.twitter.screenName }}</a></p>
	<p>
		<a :href="`${apiUrl}/connect/twitter`" target="_blank" @click.prevent="connect">{{ $store.state.i.twitter ? '%i18n:@reconnect%' : '%i18n:@connect%' }}</a>
		<span v-if="$store.state.i.twitter"> or </span>
		<a :href="`${apiUrl}/disconnect/twitter`" target="_blank" v-if="$store.state.i.twitter" @click.prevent="disconnect">%i18n:@disconnect%</a>
	</p>
	<p class="id" v-if="$store.state.i.twitter">Twitter ID: {{ $store.state.i.twitter.userId }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { apiUrl, docsUrl } from '../../../config';

export default Vue.extend({
	data() {
		return {
			form: null,
			apiUrl,
			docsUrl
		};
	},
	mounted() {
		this.$watch('$store.state.i', () => {
			if (this.$store.state.i.twitter) {
				if (this.form) this.form.close();
			}
		}, {
			deep: true
		});
	},
	methods: {
		connect() {
			this.form = window.open(apiUrl + '/connect/twitter',
				'twitter_connect_window',
				'height=570, width=520');
		},

		disconnect() {
			window.open(apiUrl + '/disconnect/twitter',
				'twitter_disconnect_window',
				'height=570, width=520');
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-twitter-setting
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
