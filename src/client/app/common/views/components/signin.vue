<template>
<form class="mk-signin" :class="{ signing }" @submit.prevent="onSubmit">
	<div class="avatar" :style="{ backgroundImage: user ? `url('${ user.avatarUrl }')` : null }" v-show="withAvatar"></div>
	<ui-input v-model="username" type="text" pattern="^[a-zA-Z0-9_]+$" spellcheck="false" autofocus required @input="onUsernameChange" styl="fill">
		<span>{{ $t('username') }}</span>
		<span slot="prefix">@</span>
		<span slot="suffix">@{{ host }}</span>
	</ui-input>
	<ui-input v-model="password" type="password" required styl="fill">
		<span>{{ $t('password') }}</span>
		<span slot="prefix"><fa icon="lock"/></span>
	</ui-input>
	<ui-input v-if="user && user.twoFactorEnabled" v-model="token" type="number" required styl="fill"/>
	<ui-button type="submit" :disabled="signing">{{ signing ? $t('signing-in') : $t('signin') }}</ui-button>
	<p style="margin: 8px 0;"><a :href="`${apiUrl}/signin/twitter`">{{ $t('signin-with-twitter') }}</a></p>
	<p style="margin: 8px 0;"><a :href="`${apiUrl}/signin/github`">{{ $t('signin-with-github') }}</a></p>
	<p style="margin: 8px 0;"><a :href="`${apiUrl}/signin/discord`">{{ $t('signin-with-discord') /* TODO: Make these layouts better */ }}</a></p>
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
			host: toUnicode(host)
		};
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
			}, true).then(() => {
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
