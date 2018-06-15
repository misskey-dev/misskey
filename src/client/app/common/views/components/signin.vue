<template>
<form class="mk-signin" :class="{ signing }" @submit.prevent="onSubmit">
	<ui-input v-model="username" type="text" pattern="^[a-zA-Z0-9_]+$" spellcheck="false" autofocus required @change="onUsernameChange">
		<span>%i18n:@username%</span>
		<span slot="prefix">@</span>
		<span slot="suffix">@{{ host }}</span>
	</ui-input>
	<ui-input v-model="password" type="password" required>
		<span>%i18n:@password%</span>
		<span slot="prefix">%fa:lock%</span>
	</ui-input>
	<ui-input v-if="user && user.twoFactorEnabled" v-model="token" type="number" required/>
	<ui-button type="submit" :disabled="signing">{{ signing ? '%i18n:@signing-in%' : '%i18n:@signin%' }}</ui-button>
	<p style="margin: 8px 0;">または<a :href="`${apiUrl}/signin/twitter`">Twitterでログイン</a></p>
</form>
</template>

<script lang="ts">
import Vue from 'vue';
import { apiUrl, host } from '../../../config';

export default Vue.extend({
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
			});
		},
		onSubmit() {
			this.signing = true;

			(this as any).api('signin', {
				username: this.username,
				password: this.password,
				token: this.user && this.user.twoFactorEnabled ? this.token : undefined
			}).then(() => {
				location.reload();
			}).catch(() => {
				alert('something happened');
				this.signing = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-signin
	&.signing
		&, *
			cursor wait !important

	label
		display block
		margin 12px 0

		[data-fa]
			display block
			pointer-events none
			position absolute
			bottom 0
			top 0
			left 0
			z-index 1
			margin auto
			padding 0 16px
			height 1em
			color #898786

		input[type=text]
		input[type=password]
		input[type=number]
			user-select text
			display inline-block
			cursor auto
			padding 0 0 0 38px
			margin 0
			width 100%
			line-height 44px
			font-size 1em
			color rgba(#000, 0.7)
			background #fff
			outline none
			border solid 1px #eee
			border-radius 4px

			&:hover
				background rgba(255, 255, 255, 0.7)
				border-color #ddd

				& + i
					color #797776

			&:focus
				background #fff
				border-color #ccc

				& + i
					color #797776

	[type=submit]
		cursor pointer
		padding 16px
		margin -6px 0 0 0
		width 100%
		font-size 1.2em
		color rgba(#000, 0.5)
		outline none
		border none
		border-radius 0
		background transparent
		transition all .5s ease

		&:hover
			color $theme-color
			transition all .2s ease

		&:focus
			color $theme-color
			transition all .2s ease

		&:active
			color darken($theme-color, 30%)
			transition all .2s ease

		&:disabled
			opacity 0.7

</style>
