<template>
<div class="mk-timeline">
	<mk-friends-maker v-if="alone"/>
	<mk-posts :posts="posts">
		<div class="init" v-if="fetching">
			%fa:spinner .pulse%%i18n:common.loading%
		</div>
		<div class="empty" v-if="!fetching && posts.length == 0">
			%fa:R comments%
			%i18n:mobile.tags.mk-home-timeline.empty-timeline%
		</div>
		<button v-if="!fetching && existMore" @click="more" :disabled="moreFetching" slot="tail">
			<span v-if="!moreFetching">%i18n:mobile.tags.mk-timeline.load-more%</span>
			<span v-if="moreFetching">%i18n:common.loading%<mk-ellipsis/></span>
		</button>
	</mk-posts>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

const limit = 10;

export default Vue.extend({
	props: {
		date: {
			type: Date,
			required: false
		}
	},
	data() {
		return {
			fetching: true,
			moreFetching: false,
			posts: [],
			existMore: false,
			connection: null,
			connectionId: null
		};
	},
	computed: {
		alone(): boolean {
			return (this as any).os.i.followingCount == 0;
		}
	},
	mounted() {
		this.connection = (this as any).os.stream.getConnection();
		this.connectionId = (this as any).os.stream.use();

		this.connection.on('post', this.onPost);
		this.connection.on('follow', this.onChangeFollowing);
		this.connection.on('unfollow', this.onChangeFollowing);

		this.fetch();
	},
	beforeDestroy() {
		this.connection.off('post', this.onPost);
		this.connection.off('follow', this.onChangeFollowing);
		this.connection.off('unfollow', this.onChangeFollowing);
		(this as any).os.stream.dispose(this.connectionId);
	},
	methods: {
		fetch(cb?) {
			this.fetching = true;
			(this as any).api('posts/timeline', {
				limit: limit + 1,
				untilDate: this.date ? (this.date as any).getTime() : undefined
			}).then(posts => {
				if (posts.length == limit + 1) {
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
			this.moreFetching = true;
			(this as any).api('posts/timeline', {
				limit: limit + 1,
				untilId: this.posts[this.posts.length - 1].id
			}).then(posts => {
				if (posts.length == limit + 1) {
					posts.pop();
					this.existMore = true;
				} else {
					this.existMore = false;
				}
				this.posts = this.posts.concat(posts);
				this.moreFetching = false;
			});
		},
		onPost(post) {
			this.posts.unshift(post);
		},
		onChangeFollowing() {
			this.fetch();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-friends-maker
	margin-bottom 8px
</style>
