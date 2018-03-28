<template>
<mk-ui>
	<main v-if="!fetching">
		<a v-if="post.next" :href="post.next">%fa:angle-up%%i18n:desktop.tags.mk-post-page.next%</a>
		<mk-post-detail :post="post"/>
		<a v-if="post.prev" :href="post.prev">%fa:angle-down%%i18n:desktop.tags.mk-post-page.prev%</a>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	data() {
		return {
			fetching: true,
			post: null
		};
	},
	watch: {
		$route: 'fetch'
	},
	created() {
		this.fetch();
	},
	methods: {
		fetch() {
			Progress.start();
			this.fetching = true;

			(this as any).api('posts/show', {
				post_id: this.$route.params.post
			}).then(post => {
				this.post = post;
				this.fetching = false;

				Progress.done();
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
main
	padding 16px
	text-align center

	> a
		display inline-block

		&:first-child
			margin-bottom 4px

		&:last-child
			margin-top 4px

		> [data-fa]
			margin-right 4px

	> .mk-post-detail
		margin 0 auto
		width 640px

</style>
