<template>
<div class="timeline">
	<header>
		<span :data-is-active="mode == 'default'" @click="mode = 'default'">投稿</span>
		<span :data-is-active="mode == 'with-replies'" @click="mode = 'with-replies'">投稿と返信</span>
	</header>
	<div class="loading" v-if="fetching">
		<mk-ellipsis-icon/>
	</div>
	<p class="empty" v-if="empty">%fa:R comments%このユーザーはまだ何も投稿していないようです。</p>
	<mk-posts ref="timeline" :posts="posts">
		<div slot="footer">
			<template v-if="!moreFetching">%fa:moon%</template>
			<template v-if="moreFetching">%fa:spinner .pulse .fw%</template>
		</div>
	</mk-posts>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['user'],
	data() {
		return {
			fetching: true,
			moreFetching: false,
			mode: 'default',
			unreadCount: 0,
			posts: [],
			date: null
		};
	},
	watch: {
		mode() {
			this.fetch();
		}
	},
	computed: {
		empty(): boolean {
			return this.posts.length == 0;
		}
	},
	mounted() {
		document.addEventListener('keydown', this.onDocumentKeydown);
		window.addEventListener('scroll', this.onScroll);

		this.fetch(() => this.$emit('loaded'));
	},
	beforeDestroy() {
		document.removeEventListener('keydown', this.onDocumentKeydown);
		window.removeEventListener('scroll', this.onScroll);
	},
	methods: {
		onDocumentKeydown(e) {
			if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
				if (e.which == 84) { // [t]
					(this.$refs.timeline as any).focus();
				}
			}
		},
		fetch(cb?) {
			(this as any).api('users/posts', {
				userId: this.user.id,
				untilDate: this.date ? this.date.getTime() : undefined,
				with_replies: this.mode == 'with-replies'
			}).then(posts => {
				this.posts = posts;
				this.fetching = false;
				if (cb) cb();
			});
		},
		more() {
			if (this.moreFetching || this.fetching || this.posts.length == 0) return;
			this.moreFetching = true;
			(this as any).api('users/posts', {
				userId: this.user.id,
				with_replies: this.mode == 'with-replies',
				untilId: this.posts[this.posts.length - 1].id
			}).then(posts => {
				this.moreFetching = false;
				this.posts = this.posts.concat(posts);
			});
		},
		onScroll() {
			const current = window.scrollY + window.innerHeight;
			if (current > document.body.offsetHeight - 16/*遊び*/) {
				this.more();
			}
		},
		warp(date) {
			this.date = date;
			this.fetch();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.timeline
	background #fff

	> header
		padding 8px 16px
		border-bottom solid 1px #eee

		> span
			margin-right 16px
			line-height 27px
			font-size 18px
			color #555

			&:not([data-is-active])
				color $theme-color
				cursor pointer

				&:hover
					text-decoration underline

	> .loading
		padding 64px 0

	> .empty
		display block
		margin 0 auto
		padding 32px
		max-width 400px
		text-align center
		color #999

		> [data-fa]
			display block
			margin-bottom 16px
			font-size 3em
			color #ccc

</style>
