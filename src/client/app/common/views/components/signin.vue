<template>
<form class="mk-signin" :class="{ signing }" @submit.prevent="onSubmit">
	<div class="avatar" :style="{ backgroundImage: user ? `url('${ user.avatarUrl }')` : null }" v-show="withAvatar"></div>
	<ui-input v-model="username" type="text" pattern="^[a-zA-Z0-9_]+$" spellcheck="false" autofocus required @input="onUsernameChange" styl="fill">
		<span>%i18n:@username%</span>
		<span slot="prefix">@</span>
		<span slot="suffix">@{{ host }}</span>
	</ui-input>
	<ui-input v-model="password" type="password" required styl="fill">
		<span>%i18n:@password%</span>
		<span slot="prefix">%fa:lock%</span>
	</ui-input>
	<ui-input v-if="user && user.twoFactorEnabled" v-model="token" type="number" required styl="fill"/>
	<ui-button type="submit" :disabled="signing">{{ signing ? '%i18n:@signing-in%' : '%i18n:@signin%' }}</ui-button>
	<p style="margin: 8px 0;">%i18n:@or% <a :href="`${apiUrl}/signin/twitter`">%i18n:@signin-with-twitter%</a></p>
</form>
</template>

<script lang="ts">
import Vue from 'vue';
import { apiUrl, host } from '../../../config';

export default Vue.extend({
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
			host
		};
	},
	methods: {
		onUsernameChange() {
			(this as any).api('users/show', {
				username: this.username
			}).then(user => {
				this.user = user;
			}, () => {
				this.user = null;
			});
		},
		onSubmit() {
			this.signing = true;

			(this as any).api('signin', {
				username: this.username,
				password: this.password,
				token: this.user && this.user.twoFactorEnabled ? this.token : undefined
			}, true).then(() => {
				location.reload();
			}).catch(() => {
				alert('%i18n:@login-failed%');
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
