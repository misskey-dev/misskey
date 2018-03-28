<template>
<div class="mk-user-timeline">
	<mk-posts :posts="posts">
		<div class="init" v-if="fetching">
			%fa:spinner .pulse%%i18n:common.loading%
		</div>
		<div class="empty" v-if="!fetching && posts.length == 0">
			%fa:R comments%
			{{ withMedia ? '%i18n:mobile.tags.mk-user-timeline.no-posts-with-media%' : '%i18n:mobile.tags.mk-user-timeline.no-posts%' }}
		</div>
		<button v-if="!fetching && existMore" @click="more" :disabled="moreFetching" slot="tail">
			<span v-if="!moreFetching">%i18n:mobile.tags.mk-user-timeline.load-more%</span>
			<span v-if="moreFetching">%i18n:common.loading%<mk-ellipsis/></span>
		</button>
	</mk-posts>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

const limit = 10;

export default Vue.extend({
	props: ['user', 'withMedia'],
	data() {
		return {
			fetching: true,
			posts: [],
			existMore: false,
			moreFetching: false
		};
	},
	mounted() {
		(this as any).api('users/posts', {
			userId: this.user.id,
			with_media: this.withMedia,
			limit: limit + 1
		}).then(posts => {
			if (posts.length == limit + 1) {
				posts.pop();
				this.existMore = true;
			}
			this.posts = posts;
			this.fetching = false;
			this.$emit('loaded');
		});
	},
	methods: {
		more() {
			this.moreFetching = true;
			(this as any).api('users/posts', {
				userId: this.user.id,
				with_media: this.withMedia,
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
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-user-timeline
	max-width 600px
	margin 0 auto
</style>
