<template>
<form class="mk-signin" :class="{ signing }" @submit.prevent="onSubmit">
	<label class="user-name">
		<input v-model="username" type="text" pattern="^[a-zA-Z0-9-]+$" placeholder="%i18n:common.tags.mk-signin.username%" autofocus required @change="onUsernameChange"/>%fa:at%
	</label>
	<label class="password">
		<input v-model="password" type="password" placeholder="%i18n:common.tags.mk-signin.password%" required/>%fa:lock%
	</label>
	<label class="token" v-if="user && user.two_factor_enabled">
		<input v-model="token" type="number" placeholder="%i18n:common.tags.mk-signin.token%" required/>%fa:lock%
	</label>
	<button type="submit" :disabled="signing">{{ signing ? '%i18n:common.tags.mk-signin.signing-in%' : '%i18n:common.tags.mk-signin.signin%' }}</button>
</form>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			signing: false,
			user: null,
			username: '',
			password: '',
			token: ''
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
				token: this.user && this.user.two_factor_enabled ? this.token : undefined
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
			color rgba(0, 0, 0, 0.7)
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
		color rgba(0, 0, 0, 0.5)
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
