<template>
<div class="mk-timeline">
	<mk-friends-maker v-if="alone"/>
	<div class="fetching" v-if="fetching">
		<mk-ellipsis-icon/>
	</div>
	<p class="empty" v-if="posts.length == 0 && !fetching">
		%fa:R comments%自分の投稿や、自分がフォローしているユーザーの投稿が表示されます。
	</p>
	<mk-posts :posts="posts" ref="timeline">
		<button slot="footer" @click="more" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }">
			<template v-if="!moreFetching">もっと見る</template>
			<template v-if="moreFetching">%fa:spinner .pulse .fw%</template>
		</button>
	</mk-posts>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { url } from '../../../config';

export default Vue.extend({
	data() {
		return {
			fetching: true,
			moreFetching: false,
			existMore: false,
			posts: [],
			connection: null,
			connectionId: null,
			date: null
		};
	},
	computed: {
		alone(): boolean {
			return (this as any).os.i.following_count == 0;
		}
	},
	mounted() {
		this.connection = (this as any).os.stream.getConnection();
		this.connectionId = (this as any).os.stream.use();

		this.connection.on('post', this.onPost);
		this.connection.on('follow', this.onChangeFollowing);
		this.connection.on('unfollow', this.onChangeFollowing);

		document.addEventListener('keydown', this.onKeydown);
		window.addEventListener('scroll', this.onScroll);

		this.fetch();
	},
	beforeDestroy() {
		this.connection.off('post', this.onPost);
		this.connection.off('follow', this.onChangeFollowing);
		this.connection.off('unfollow', this.onChangeFollowing);
		(this as any).os.stream.dispose(this.connectionId);

		document.removeEventListener('keydown', this.onKeydown);
		window.removeEventListener('scroll', this.onScroll);
	},
	methods: {
		fetch(cb?) {
			this.fetching = true;

			(this as any).api('posts/timeline', {
				limit: 11,
				until_date: this.date ? this.date.getTime() : undefined
			}).then(posts => {
				if (posts.length == 11) {
					posts.pop();
					this.existMore = true;
				}
				this.posts = posts;
				this.fetching = false;
				this.$emit('loaded');
				if (cb) cb();
			});
		},
		more() {
			if (this.moreFetching || this.fetching || this.posts.length == 0 || !this.existMore) return;
			this.moreFetching = true;
			(this as any).api('posts/timeline', {
				limit: 11,
				until_id: this.posts[this.posts.length - 1].id
			}).then(posts => {
				if (posts.length == 11) {
					posts.pop();
				} else {
					this.existMore = false;
				}
				this.posts = this.posts.concat(posts);
				this.moreFetching = false;
			});
		},
		onPost(post) {
			// サウンドを再生する
			if ((this as any).os.isEnableSounds) {
				new Audio(`${url}/assets/post.mp3`).play();
			}

			this.posts.unshift(post);
		},
		onChangeFollowing() {
			this.fetch();
		},
		onScroll() {
			if ((this as any).os.i.client_settings.fetchOnScroll !== false) {
				const current = window.scrollY + window.innerHeight;
				if (current > document.body.offsetHeight - 8) this.more();
			}
		},
		onKeydown(e) {
			if (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
				if (e.which == 84) { // t
					(this.$refs.timeline as any).focus();
				}
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
.mk-timeline
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px

	> .mk-friends-maker
		border-bottom solid 1px #eee

	> .fetching
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
