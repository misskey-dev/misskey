<template>
<div class="mk-posts">
	<template v-for="(post, i) in _posts">
		<x-post :post="post" :key="post.id" @update:post="onPostUpdated(i, $event)"/>
		<p class="date" v-if="i != posts.length - 1 && post._date != _posts[i + 1]._date">
			<span>%fa:angle-up%{{ post._datetext }}</span>
			<span>%fa:angle-down%{{ _posts[i + 1]._datetext }}</span>
		</p>
	</template>
	<footer>
		<slot name="footer"></slot>
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
				const date = new Date(post.createdAt).getDate();
				const month = new Date(post.createdAt).getMonth() + 1;
				post._date = date;
				post._datetext = `${month}月 ${date}日`;
				return post;
			});
		}
	},
	methods: {
		focus() {
			(this.$el as any).children[0].focus();
		},
		onPostUpdated(i, post) {
			Vue.set((this as any).posts, i, post);
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-posts

	> .date
		display block
		margin 0
		line-height 32px
		font-size 14px
		text-align center
		color #aaa
		background #fdfdfd
		border-bottom solid 1px #eaeaea

		span
			margin 0 16px

		[data-fa]
			margin-right 8px

	> footer
		> *
			display block
			margin 0
			padding 16px
			width 100%
			text-align center
			color #ccc
			border-top solid 1px #eaeaea
			border-bottom-left-radius 4px
			border-bottom-right-radius 4px

		> button
			&:hover
				background #f5f5f5

			&:active
				background #eee
</style>
