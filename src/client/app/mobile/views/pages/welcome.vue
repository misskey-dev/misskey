<template>
<div class="welcome">
	<div>
		<img :src="$store.state.device.darkmode ? 'assets/title.dark.svg' : 'assets/title.light.svg'" alt="Misskey">
		<p class="host">{{ host }}</p>
		<div class="about">
			<h2>{{ name || 'unidentified' }}</h2>
			<p v-html="description || '%i18n:common.about%'"></p>
			<router-link class="signup" to="/signup">新規登録</router-link>
		</div>
		<div class="login">
			<form @submit.prevent="onSubmit">
				<ui-input v-model="username" type="text" pattern="^[a-zA-Z0-9_]+$" autofocus required @change="onUsernameChange">
					<span>ユーザー名</span>
					<span slot="prefix">@</span>
					<span slot="suffix">@{{ host }}</span>
				</ui-input>
				<ui-input v-model="password" type="password" required>
					<span>パスワード</span>
					<span slot="prefix">%fa:lock%</span>
				</ui-input>
				<ui-input v-if="user && user.twoFactorEnabled" v-model="token" type="number" required/>
				<ui-button type="submit" :disabled="signing">{{ signing ? 'ログインしています' : 'ログイン' }}</ui-button>
			</form>
			<div>
				<a :href="`${apiUrl}/signin/twitter`">Twitterでログイン</a>
			</div>
		</div>
		<footer>
			<small>{{ copyright }}</small>
		</footer>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { apiUrl, copyright, host } from '../../../config';

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
			users: [],
			host
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
.welcome
	text-align center
	//background #fff

	> div
		padding 32px
		margin 0 auto
		max-width 500px

		> img
			display block
			max-width 200px
			margin 0 auto

		> .host
			display block
			text-align center
			padding 6px 12px
			line-height 32px
			font-weight bold
			color #333
			background rgba(#000, 0.035)
			border-radius 6px

		> .about
			margin-top 16px
			padding 16px
			color #555
			background #fff
			border-radius 6px

			> h2
				margin 0

			> p
				margin 8px

			> .signup
				font-weight bold

		> .login
			margin 16px 0

			> form

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
						box-shadow 0 1px 3px rgba(#000, 0.075), inset 0 0 5px rgba(#000, 0.2)

		> footer
			text-align center
			color #444

			> small
				display block
				margin 16px 0 0 0
				opacity 0.7

</style>
