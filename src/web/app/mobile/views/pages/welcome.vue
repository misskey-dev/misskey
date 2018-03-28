<template>
<div class="welcome">
	<h1><b>Misskey</b>へようこそ</h1>
	<p>Twitter風ミニブログSNS、Misskeyへようこそ。共有したいことを投稿したり、タイムラインでみんなの投稿を読むこともできます。<br><a href="/signup">アカウントを作成する</a></p>
	<div class="form">
		<p>%fa:lock% ログイン</p>
		<div>
			<form @submit.prevent="onSubmit">
				<input v-model="username" type="text" pattern="^[a-zA-Z0-9_]+$" placeholder="ユーザー名" autofocus required @change="onUsernameChange"/>
				<input v-model="password" type="password" placeholder="パスワード" required/>
				<input v-if="user && user.account.two_factor_enabled" v-model="token" type="number" placeholder="トークン" required/>
				<button type="submit" :disabled="signing">{{ signing ? 'ログインしています' : 'ログイン' }}</button>
			</form>
			<div>
				<a :href="`${apiUrl}/signin/twitter`">Twitterでログイン</a>
			</div>
		</div>
	</div>
	<div class="tl">
		<p>%fa:comments R% タイムラインを見てみる</p>
		<mk-welcome-timeline/>
	</div>
	<div class="users">
		<router-link v-for="user in users" :key="user.id" class="avatar-anchor" :to="`/@${user.username}`">
			<img class="avatar" :src="`${user.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		</router-link>
	</div>
	<footer>
		<small>{{ copyright }}</small>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { apiUrl, copyright } from '../../../config';

export default Vue.extend({
	data() {
		return {
			signing: false,
			user: null,
			username: '',
			password: '',
			token: '',
			apiUrl,
			copyright,
			users: []
		};
	},
	mounted() {
		(this as any).api('users', {
			sort: '+follower',
			limit: 20
		}).then(users => {
			this.users = users;
		});
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
				token: this.user && this.user.account.two_factor_enabled ? this.token : undefined
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
		color #cacac3

		& + p
			margin 0 0 16px 0
			padding 0 8px 0 8px
			color #949fa9

	.form
		margin-bottom 16px
		background #fff
		border solid 1px rgba(0, 0, 0, 0.2)
		border-radius 8px
		overflow hidden

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

	> .tl
		background #fff
		border solid 1px rgba(0, 0, 0, 0.2)
		border-radius 8px
		overflow hidden

		> p
			margin 0
			padding 12px 20px
			color #555
			background #f5f5f5
			border-bottom solid 1px #ddd

		> .mk-welcome-timeline
			max-height 300px
			overflow auto

	> .users
		margin 12px 0 0 0

		> *
			display inline-block
			margin 4px

			> *
				display inline-block
				width 38px
				height 38px
				vertical-align top
				border-radius 6px

	> footer
		text-align center
		color #fff

		> small
			display block
			margin 16px 0 0 0
			opacity 0.7

</style>

<style lang="stylus">
html
body
	background linear-gradient(to bottom, #1e1d65, #bd6659)
</style>
