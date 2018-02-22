<template>
<div class="mk-timeline">
	<mk-friends-maker v-if="alone"/>
	<mk-posts ref="timeline" :posts="posts">
		<div class="init" v-if="fetching">
			%fa:spinner .pulse%%i18n:common.loading%
		</div>
		<div class="empty" v-if="!fetching && posts.length == 0">
			%fa:R comments%
			%i18n:mobile.tags.mk-home-timeline.empty-timeline%
		</div>
		<button @click="more" :disabled="fetching" slot="tail">
			<span v-if="!fetching">%i18n:mobile.tags.mk-timeline.load-more%</span>
			<span v-if="fetching">%i18n:common.loading%<mk-ellipsis/></span>
		</button>
	</mk-posts>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
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
			connection: null,
			connectionId: null
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
				until_date: this.date ? (this.date as any).getTime() : undefined
			}).then(posts => {
				this.posts = posts;
				this.fetching = false;
				if (cb) cb();
			});
		},
		more() {
			if (this.moreFetching || this.fetching || this.posts.length == 0) return;
			this.moreFetching = true;
			(this as any).api('posts/timeline', {
				until_id: this.posts[this.posts.length - 1].id
			}).then(posts => {
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
