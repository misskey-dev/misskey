<template>
<div class="mk-discord-setting">
	<p>{{ $t('description') }}</p>
	<p class="account" v-if="$store.state.i.discord" :title="`Discord ID: ${$store.state.i.discord.id}`">{{ $t('connected-to') }}: <a :href="`https://discordapp.com/users/${$store.state.i.discord.id}`" target="_blank">@{{ $store.state.i.discord.username }}#{{ $store.state.i.discord.discriminator }}</a></p>
	<p>
		<a :href="`${apiUrl}/connect/discord`" target="_blank" @click.prevent="connect">{{ $store.state.i.discord ? this.$t('reconnect') : this.$t('connect') }}</a>
		<span v-if="$store.state.i.discord"> or </span>
		<a :href="`${apiUrl}/disconnect/discord`" target="_blank" v-if="$store.state.i.discord" @click.prevent="disconnect">{{ $t('disconnect') }}</a>
	</p>
	<p class="id" v-if="$store.state.i.discord">Discord ID: {{ $store.state.i.discord.id }}</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { apiUrl } from '../../../config';

export default Vue.extend({
	i18n: i18n('common/views/components/discord-setting.vue'),
	data() {
		return {
			form: null,
			apiUrl
		};
	},
	mounted() {
		this.$watch('$store.state.i', () => {
			if (this.$store.state.i.discord && this.form)
				this.form.close();
		}, {
			deep: true
		});
	},
	methods: {
		connect() {
			this.form = window.open(apiUrl + '/connect/discord',
				'discord_connect_window',
				'height=570, width=520');
		},

		disconnect() {
			window.open(apiUrl + '/disconnect/discord',
				'discord_disconnect_window',
				'height=570, width=520');
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-discord-setting
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
