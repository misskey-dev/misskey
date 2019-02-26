<template>
<form class="mk-signin" :class="{ signing }" @submit.prevent="onSubmit">
	<div class="avatar" :style="{ backgroundImage: user ? `url('${ user.avatarUrl }')` : null }" v-show="withAvatar"></div>
	<ui-input v-model="username" type="text" pattern="^[a-zA-Z0-9_]+$" spellcheck="false" autofocus required @input="onUsernameChange">
		<span>{{ $t('username') }}</span>
		<template #prefix>@</template>
		<template #suffix>@{{ host }}</template>
	</ui-input>
	<ui-input v-model="password" type="password" :with-password-toggle="true" required>
		<span>{{ $t('password') }}</span>
		<template #prefix><fa icon="lock"/></template>
	</ui-input>
	<ui-input v-if="user && user.twoFactorEnabled" v-model="token" type="number" required>
		<span>{{ $t('@.2fa') }}</span>
		<template #prefix><fa icon="gavel"/></template>
	</ui-input>
	<ui-button type="submit" :disabled="signing">{{ signing ? $t('signing-in') : $t('@.signin') }}</ui-button>
	<p v-if="meta && meta.enableTwitterIntegration" style="margin: 8px 0;"><a :href="`${apiUrl}/signin/twitter`">{{ $t('signin-with-twitter') }}</a></p>
	<p v-if="meta && meta.enableGithubIntegration"  style="margin: 8px 0;"><a :href="`${apiUrl}/signin/github`">{{ $t('signin-with-github') }}</a></p>
	<p v-if="meta && meta.enableDiscordIntegration" style="margin: 8px 0;"><a :href="`${apiUrl}/signin/discord`">{{ $t('signin-with-discord') /* TODO: Make these layouts better */ }}</a></p>
</form>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { apiUrl, host } from '../../../config';
import { toUnicode } from 'punycode';

export default Vue.extend({
	i18n: i18n('common/views/components/signin.vue'),

	props: {
		withAvatar: {
			type: Boolean,
			required: false,
			default: true
		}
	},

	data() {
		return {
			signing: false,
			user: null,
			username: '',
			password: '',
			token: '',
			apiUrl,
			host: toUnicode(host),
			meta: null
		};
	},

	created() {
		this.$root.getMeta().then(meta => {
			this.meta = meta;
		});
	},

	methods: {
		onUsernameChange() {
			this.$root.api('users/show', {
				username: this.username
			}).then(user => {
				this.user = user;
			}, () => {
				this.user = null;
			});
		},

		onSubmit() {
			this.signing = true;

			this.$root.api('signin', {
				username: this.username,
				password: this.password,
				token: this.user && this.user.twoFactorEnabled ? this.token : undefined
			}).then(res => {
				localStorage.setItem('i', res.i);
				location.reload();
			}).catch(() => {
				alert(this.$t('login-failed'));
				this.signing = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-signin
	color #555

	&.signing
		&, *
			cursor wait !important

	> .avatar
		margin 0 auto 0 auto
		width 64px
		height 64px
		background #ddd
		background-position center
		background-size cover
		border-radius 100%

</style>
