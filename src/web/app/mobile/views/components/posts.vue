<template>
<div class="mk-posts">
	<slot name="head"></slot>
	<slot></slot>
	<template v-for="(post, i) in _posts">
		<x-post :post="post" :key="post.id" @update:post="onPostUpdated(i, $event)"/>
		<p class="date" v-if="i != posts.length - 1 && post._date != _posts[i + 1]._date">
			<span>%fa:angle-up%{{ post._datetext }}</span>
			<span>%fa:angle-down%{{ _posts[i + 1]._datetext }}</span>
		</p>
	</template>
	<footer>
		<slot name="tail"></slot>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XPost from './posts.post.vue';

export default Vue.extend({
	components: {
		XPost
	},
	props: {
		posts: {
			type: Array,
			default: () => []
		}
	},
	computed: {
		_posts(): any[] {
			return (this.posts as any).map(post => {
				const date = new Date(post.created_at).getDate();
				const month = new Date(post.created_at).getMonth() + 1;
				post._date = date;
				post._datetext = `${month}月 ${date}日`;
				return post;
			});
		}
	},
	methods: {
		onPostUpdated(i, post) {
			Vue.set((this as any).posts, i, post);
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-posts
	background #fff
	border-radius 8px
	box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

	> .init
		padding 64px 0
		text-align center
		color #999

		> [data-fa]
			margin-right 4px

	> .empty
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

	> .date
		display block
		margin 0
		line-height 32px
		text-align center
		font-size 0.9em
		color #aaa
		background #fdfdfd
		border-bottom solid 1px #eaeaea

		span
			margin 0 16px

		[data-fa]
			margin-right 8px

	> footer
		text-align center
		border-top solid 1px #eaeaea
		border-bottom-left-radius 4px
		border-bottom-right-radius 4px

		&:empty
			display none

		> button
			margin 0
			padding 16px
			width 100%
			color $theme-color
			border-radius 0 0 8px 8px

			&:disabled
				opacity 0.7

</style>
