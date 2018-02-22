<template>
<div class="welcome">
	<h1><b>Misskey</b>へようこそ</h1>
	<p>Twitter風ミニブログSNS、Misskeyへようこそ。思ったことを投稿したり、タイムラインでみんなの投稿を読むこともできます。</p>
	<div class="form">
		<p>ログイン</p>
		<div>
			<form @submit.prevent="onSubmit">
				<input v-model="username" type="text" pattern="^[a-zA-Z0-9-]+$" placeholder="ユーザー名" autofocus required @change="onUsernameChange"/>
				<input v-model="password" type="password" placeholder="パスワード" required/>
				<input v-if="user && user.two_factor_enabled" v-model="token" type="number" placeholder="トークン" required/>
				<button type="submit" :disabled="signing">{{ signing ? 'ログインしています' : 'ログイン' }}</button>
			</form>
			<div>
				<a :href="`${apiUrl}/signin/twitter`">Twitterでログイン</a>
			</div>
		</div>
	</div>
	<a href="/signup">アカウントを作成する</a>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { apiUrl } from '../../../config';

export default Vue.extend({
	data() {
		return {
			signing: false,
			user: null,
			username: '',
			password: '',
			token: '',
			apiUrl
		};
	},
	mounted() {
		document.documentElement.style.background = '#293946';
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
.welcome
	padding 16px
	margin 0 auto
	max-width 500px

	h1
		margin 0
		padding 8px
		font-size 1.5em
		font-weight normal
		color #c3c6ca

		& + p
			margin 0 0 16px 0
			padding 0 8px 0 8px
			color #949fa9

	.form
		background #fff
		border solid 1px rgba(0, 0, 0, 0.2)
		border-radius 8px
		overflow hidden

		& + a
			display block
			margin-top 16px
			text-align center

		> p
			margin 0
			padding 12px 20px
			color #555
			background #f5f5f5
			border-bottom solid 1px #ddd

		> div

			> form
				padding 16px
				border-bottom solid 1px #ddd

				input
					display block
					padding 12px
					margin 0 0 16px 0
					width 100%
					font-size 1em
					color rgba(0, 0, 0, 0.7)
					background #fff
					outline none
					border solid 1px #ddd
					border-radius 4px

				button
					display block
					width 100%
					padding 10px
					margin 0
					color #333
					font-size 1em
					text-align center
					text-decoration none
					text-shadow 0 1px 0 rgba(255, 255, 255, 0.9)
					background-image linear-gradient(#fafafa, #eaeaea)
					border 1px solid #ddd
					border-bottom-color #cecece
					border-radius 4px

					&:active
						background-color #767676
						background-image none
						border-color #444
						box-shadow 0 1px 3px rgba(0, 0, 0, 0.075), inset 0 0 5px rgba(0, 0, 0, 0.2)

			> div
				padding 16px
				text-align center

</style>
