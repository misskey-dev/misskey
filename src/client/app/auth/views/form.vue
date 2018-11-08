<template>
<div class="form">
	<header>
		<h1>{{ $t('share-access') }}</h1>
		<img :src="app.iconUrl"/>
	</header>
	<div class="app">
		<section>
			<h2>{{ app.name }}</h2>
			<p class="id">{{ app.id }}</p>
			<p class="description">{{ app.description }}</p>
		</section>
		<section>
			<h2>{{ $t('permission-ask') }}</h2>
			<ul>
				<template v-for="p in app.permission">
					<li v-if="p == 'account-read'">{{ $t('account-read') }}</li>
					<li v-if="p == 'account-write'">{{ $t('account-write') }}</li>
					<li v-if="p == 'note-write'">{{ $t('note-write') }}</li>
					<li v-if="p == 'like-write'">{{ $t('like-write') }}</li>
					<li v-if="p == 'following-write'">{{ $t('following-write') }}</li>
					<li v-if="p == 'drive-read'">{{ $t('drive-read') }}</li>
					<li v-if="p == 'drive-write'">{{ $t('drive-write') }}</li>
					<li v-if="p == 'notification-read'">{{ $t('notification-read') }}</li>
					<li v-if="p == 'notification-write'">{{ $t('notification-write') }}</li>
				</template>
			</ul>
		</section>
	</div>
	<div class="action">
		<button @click="cancel">{{ $t('cancel') }}</button>
		<button @click="accept">{{ $t('accept') }}</button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';

export default Vue.extend({
	i18n: i18n('auth/views/form.vue'),
	props: ['session'],
	computed: {
		app(): any {
			return this.session.app;
		}
	},
	methods: {
		cancel() {
			this.$root.api('auth/deny', {
				token: this.session.token
			}).then(() => {
				this.$emit('denied');
			});
		},

		accept() {
			this.$root.api('auth/accept', {
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
			box-shadow 0 2px 2px rgba(#000, 0.1)

	> .app
		padding 44px 16px 0 16px
		color #555
		background #eee
		box-shadow 0 2px 2px rgba(#000, 0.1) inset

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
