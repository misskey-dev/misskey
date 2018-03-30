<template>
<div class="form">
	<header>
		<h1><i>{{ app.name }}</i>があなたのアカウントにアクセスすることを<b>許可</b>しますか？</h1>
		<img :src="`${app.iconUrl}?thumbnail&size=64`"/>
	</header>
	<div class="app">
		<section>
			<h2>{{ app.name }}</h2>
			<p class="nid">{{ app.nameId }}</p>
			<p class="description">{{ app.description }}</p>
		</section>
		<section>
			<h2>このアプリは次の権限を要求しています:</h2>
			<ul>
				<template v-for="p in app.permission">
					<li v-if="p == 'account-read'">アカウントの情報を見る。</li>
					<li v-if="p == 'account-write'">アカウントの情報を操作する。</li>
					<li v-if="p == 'post-write'">投稿する。</li>
					<li v-if="p == 'like-write'">いいねしたりいいね解除する。</li>
					<li v-if="p == 'following-write'">フォローしたりフォロー解除する。</li>
					<li v-if="p == 'drive-read'">ドライブを見る。</li>
					<li v-if="p == 'drive-write'">ドライブを操作する。</li>
					<li v-if="p == 'notification-read'">通知を見る。</li>
					<li v-if="p == 'notification-write'">通知を操作する。</li>
				</template>
			</ul>
		</section>
	</div>
	<div class="action">
		<button @click="cancel">キャンセル</button>
		<button @click="accept">アクセスを許可</button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['session'],
	computed: {
		app(): any {
			return this.session.app;
		}
	},
	methods: {
		cancel() {
			(this as any).api('auth/deny', {
				token: this.session.token
			}).then(() => {
				this.$emit('denied');
			});
		},

		accept() {
			(this as any).api('auth/accept', {
				token: this.session.token
			}).then(() => {
				this.$emit('accepted');
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.form

	> header
		> h1
			margin 0
			padding 32px 32px 20px 32px
			font-size 24px
			font-weight normal
			color #777

			i
				color #77aeca

				&:before
					content '「'

				&:after
					content '」'

			b
				color #666

		> img
			display block
			z-index 1
			width 84px
			height 84px
			margin 0 auto -38px auto
			border solid 5px #fff
			border-radius 100%
			box-shadow 0 2px 2px rgba(0, 0, 0, 0.1)

	> .app
		padding 44px 16px 0 16px
		color #555
		background #eee
		box-shadow 0 2px 2px rgba(0, 0, 0, 0.1) inset

		&:after
			content ''
			display block
			clear both

		> section
			float left
			width 50%
			padding 8px
			text-align left

			> h2
				margin 0
				font-size 16px
				color #777

	> .action
		padding 16px

		> button
			margin 0 8px
			padding 0

	@media (max-width 600px)
		> header
			> img
				box-shadow none

		> .app
			box-shadow none

	@media (max-width 500px)
		> header
			> h1
				font-size 16px

</style>
