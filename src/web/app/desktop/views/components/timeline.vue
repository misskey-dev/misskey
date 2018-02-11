<template>
<div class="mk-timeline" ref="root">
	<template v-for="(post, i) in _posts">
		<mk-timeline-post :post.sync="post" :key="post.id"/>
		<p class="date" :key="post.id + '-time'" v-if="i != _posts.length - 1 && _post._date != _posts[i + 1]._date"><span>%fa:angle-up%{{ post._datetext }}</span><span>%fa:angle-down%{{ _posts[i + 1]._datetext }}</span></p>
	</template>
	<footer data-yield="footer">
		<yield from="footer"/>
	</footer>
</div>	
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['posts'],
	computed: {
		_posts(): any {
			return this.posts.map(post => {
				const date = new Date(post.created_at).getDate();
				const month = new Date(post.created_at).getMonth() + 1;
				post._date = date;
				post._datetext = `${month}月 ${date}日`;
				return post;
			});
		},
		tail(): any {
			return this.posts[this.posts.length - 1];
		}
	},
	methods: {
		focus() {
			this.$refs.root.children[0].focus();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-timeline

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
		padding 16px
		text-align center
		color #ccc
		border-top solid 1px #eaeaea
		border-bottom-left-radius 4px
		border-bottom-right-radius 4px

</style>
