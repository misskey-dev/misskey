<template>
<form class="mk-signup" @submit.prevent="onSubmit" autocomplete="off">
	<label class="username">
		<ui-input v-model="username" type="text" pattern="^[a-zA-Z0-9_]{1,20}$" autocomplete="off" required @input="onChangeUsername">
			<span>%i18n:@username%</span>
			<span slot="prefix">@</span>
			<span slot="suffix">@{{ host }}</span>
			<p slot="text" v-if="usernameState == 'wait'" style="color:#999">%fa:spinner .pulse .fw%%i18n:@checking%</p>
			<p slot="text" v-if="usernameState == 'ok'" style="color:#3CB7B5">%fa:check .fw%%i18n:@available%</p>
			<p slot="text" v-if="usernameState == 'unavailable'" style="color:#FF1161">%fa:exclamation-triangle .fw%%i18n:@unavailable%</p>
			<p slot="text" v-if="usernameState == 'error'" style="color:#FF1161">%fa:exclamation-triangle .fw%%i18n:@error%</p>
			<p slot="text" v-if="usernameState == 'invalid-format'" style="color:#FF1161">%fa:exclamation-triangle .fw%%i18n:@invalid-format%</p>
			<p slot="text" v-if="usernameState == 'min-range'" style="color:#FF1161">%fa:exclamation-triangle .fw%%i18n:@too-short%</p>
			<p slot="text" v-if="usernameState == 'max-range'" style="color:#FF1161">%fa:exclamation-triangle .fw%%i18n:@too-long%</p>
		</ui-input>
	</label>
	<label class="password">
		<ui-input v-model="password" type="password" autocomplete="off" required @input="onChangePassword">
			<span>%i18n:@password%</span>
			<span slot="prefix">%fa:lock%</span>
			<div slot="text">

			</div>
		</ui-input>
		<div class="meter" v-show="passwordStrength != ''" :data-strength="passwordStrength">
			<div class="value" ref="passwordMetar"></div>
		</div>
		<p class="info" v-if="passwordStrength == 'low'" style="color:#FF1161">%fa:exclamation-triangle .fw%%i18n:@weak-password%</p>
		<p class="info" v-if="passwordStrength == 'medium'" style="color:#3CB7B5">%fa:check .fw%%i18n:@normal-password%</p>
		<p class="info" v-if="passwordStrength == 'high'" style="color:#3CB7B5">%fa:check .fw%%i18n:@strong-password%</p>
	</label>
	<label class="retype-password">
		<ui-input v-model="retypedPassword" type="password" autocomplete="off" required @input="onChangePasswordRetype">
			<span>%i18n:@password% (%i18n:@retype%)</span>
			<span slot="prefix">%fa:lock%</span>
		</ui-input>
		<p class="info" v-if="passwordRetypeState == 'match'" style="color:#3CB7B5">%fa:check .fw%%i18n:@password-matched%</p>
		<p class="info" v-if="passwordRetypeState == 'not-match'" style="color:#FF1161">%fa:exclamation-triangle .fw%%i18n:@password-not-matched%</p>
	</label>
	<label class="recaptcha">
		<div class="g-recaptcha" :data-sitekey="recaptchaSitekey"></div>
	</label>
	<label class="agree-tou">
		<input name="agree-tou" type="checkbox" autocomplete="off" required/>
		<p><a :href="touUrl" target="_blank">利用規約</a>に同意する</p>
	</label>
	<button type="submit">%i18n:@create%</button>
</form>
</template>

<script lang="ts">
import Vue from 'vue';
const getPasswordStrength = require('syuilo-password-strength');
import { host, url, docsUrl, lang, recaptchaSitekey } from '../../../config';

export default Vue.extend({
	data() {
		return {
			host,
			username: '',
			password: '',
			retypedPassword: '',
			url,
			touUrl: `${docsUrl}/${lang}/tou`,
			recaptchaSitekey,
			usernameState: null,
			passwordStrength: '',
			passwordRetypeState: null
		}
	},
	computed: {
		shouldShowProfileUrl(): boolean {
			return (this.username != '' &&
				this.usernameState != 'invalid-format' &&
				this.usernameState != 'min-range' &&
				this.usernameState != 'max-range');
		}
	},
	methods: {
		onChangeUsername() {
			if (this.username == '') {
				this.usernameState = null;
				return;
			}

			const err =
				!this.username.match(/^[a-zA-Z0-9_]+$/) ? 'invalid-format' :
				this.username.length < 1 ? 'min-range' :
				this.username.length > 20 ? 'max-range' :
				null;

			if (err) {
				this.usernameState = err;
				return;
			}

			this.usernameState = 'wait';

			(this as any).api('username/available', {
				username: this.username
			}).then(result => {
				this.usernameState = result.available ? 'ok' : 'unavailable';
			}).catch(err => {
				this.usernameState = 'error';
			});
		},
		onChangePassword() {
			if (this.password == '') {
				this.passwordStrength = '';
				return;
			}

			const strength = getPasswordStrength(this.password);
			this.passwordStrength = strength > 0.7 ? 'high' : strength > 0.3 ? 'medium' : 'low';
			(this.$refs.passwordMetar as any).style.width = `${strength * 100}%`;
		},
		onChangePasswordRetype() {
			if (this.retypedPassword == '') {
				this.passwordRetypeState = null;
				return;
			}

			this.passwordRetypeState = this.password == this.retypedPassword ? 'match' : 'not-match';
		},
		onSubmit() {
			(this as any).api('signup', {
				username: this.username,
				password: this.password,
				'g-recaptcha-response': (window as any).grecaptcha.getResponse()
			}).then(() => {
				(this as any).api('signin', {
					username: this.username,
					password: this.password
				}).then(() => {
					location.href = '/';
				});
			}).catch(() => {
				alert('%i18n:@some-error%');

				(window as any).grecaptcha.reset();
			});
		}
	},
	mounted() {
		const head = document.getElementsByTagName('head')[0];
		const script = document.createElement('script');
		script.setAttribute('src', 'https://www.google.com/recaptcha/api.js');
		head.appendChild(script);
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-signup
	min-width 302px

	label
		display block
		margin 0 0 16px 0

		> .caption
			margin 0 0 4px 0
			color #828888
			font-size 0.95em

			> [data-fa]
				margin-right 0.25em
				color #96adac

		> .info
			display block
			margin 4px 0
			font-size 0.8em

			> [data-fa]
				margin-right 0.3em

		&.username
			.profile-page-url-preview
				display block
				margin 4px 8px 0 4px
				font-size 0.8em
				color #888

				&:empty
					display none

				&:not(:empty) + .info
					margin-top 0

		&.password
			.meter
				display block
				margin-top 8px
				width 100%
				height 8px

				&[data-strength='']
					display none

				&[data-strength='low']
					> .value
						background #d73612

				&[data-strength='medium']
					> .value
						background #d7ca12

				&[data-strength='high']
					> .value
						background #61bb22

				> .value
					display block
					width 0%
					height 100%
					background transparent
					border-radius 4px
					transition all 0.1s ease

	[type=text], [type=password]
		user-select text
		display inline-block
		cursor auto
		padding 0 12px
		margin 0
		width 100%
		line-height 44px
		font-size 1em
		color #333 !important
		background #fff !important
		outline none
		border solid 1px rgba(#000, 0.1)
		border-radius 4px
		box-shadow 0 0 0 114514px #fff inset
		transition all .3s ease

		&:hover
			border-color rgba(#000, 0.2)
			transition all .1s ease

		&:focus
			color $theme-color !important
			border-color $theme-color
			box-shadow 0 0 0 1024px #fff inset, 0 0 0 4px rgba($theme-color, 10%)
			transition all 0s ease

		&:disabled
			opacity 0.5

	.agree-tou
		padding 4px
		border-radius 4px

		&:hover
			background #f4f4f4

		&:active
			background #eee

		&, *
			cursor pointer

		p
			display inline
			color #555

	button
		margin 0
		padding 16px
		width 100%
		font-size 1em
		color #fff
		background $theme-color
		border-radius 3px

		&:hover
			background lighten($theme-color, 5%)

		&:active
			background darken($theme-color, 5%)

</style>
