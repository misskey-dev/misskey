<template>
<div class="mk-user-home-posts">
	<p class="initializing" v-if="initializing">%fa:spinner .pulse .fw%%i18n:mobile.tags.mk-user-overview-posts.loading%<mk-ellipsis/></p>
	<div v-if="!initializing && posts.length > 0">
		<mk-post-card v-for="post in posts" :key="post.id" :post="post"/>
	</div>
	<p class="empty" v-if="!initializing && posts.length == 0">%i18n:mobile.tags.mk-user-overview-posts.no-posts%</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['user'],
	data() {
		return {
			fetching: true,
			posts: []
		};
	},
	mounted() {
		(this as any).api('users/posts', {
			user_id: this.user.id
		}).then(posts => {
			this.posts = posts;
			this.fetching = false;
		});
	}
});
</script>

<style lang="stylus" scoped>
.mk-user-home-posts

	> div
		overflow-x scroll
		-webkit-overflow-scrolling touch
		white-space nowrap
		padding 8px

		> *
			vertical-align top

			&:not(:last-child)
				margin-right 8px

	> .initializing
	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

		> i
			margin-right 4px

</style>
