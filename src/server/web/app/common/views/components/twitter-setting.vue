<template>
<div class="mk-twitter-setting">
	<p>%i18n:common.tags.mk-twitter-setting.description%<a :href="`${docsUrl}/link-to-twitter`" target="_blank">%i18n:common.tags.mk-twitter-setting.detail%</a></p>
	<p class="account" v-if="os.i.account.twitter" :title="`Twitter ID: ${os.i.account.twitter.user_id}`">%i18n:common.tags.mk-twitter-setting.connected-to%: <a :href="`https://twitter.com/${os.i.account.twitter.screen_name}`" target="_blank">@{{ os.i.account.twitter.screen_name }}</a></p>
	<p>
		<a :href="`${apiUrl}/connect/twitter`" target="_blank" @click.prevent="connect">{{ os.i.account.twitter ? '%i18n:common.tags.mk-twitter-setting.reconnect%' : '%i18n:common.tags.mk-twitter-setting.connect%' }}</a>
		<span v-if="os.i.account.twitter"> or </span>
		<a :href="`${apiUrl}/disconnect/twitter`" target="_blank" v-if="os.i.account.twitter" @click.prevent="disconnect">%i18n:common.tags.mk-twitter-setting.disconnect%</a>
	</p>
	<p class="id" v-if="os.i.account.twitter">Twitter ID: {{ os.i.account.twitter.user_id }}</p>
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
		this.$watch('os.i', () => {
			if ((this as any).os.i.account.twitter) {
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
	color #4a535a

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
