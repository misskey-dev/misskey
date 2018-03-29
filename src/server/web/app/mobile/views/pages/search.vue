<template>
<mk-ui>
	<span slot="header">%fa:search% {{ q }}</span>
	<main v-if="!fetching">
		<mk-posts :class="$style.posts" :posts="posts">
			<span v-if="posts.length == 0">{{ '%i18n:mobile.tags.mk-search-posts.empty%'.replace('{}', q) }}</span>
			<button v-if="existMore" @click="more" :disabled="fetching" slot="tail">
				<span v-if="!fetching">%i18n:mobile.tags.mk-timeline.load-more%</span>
				<span v-if="fetching">%i18n:common.loading%<mk-ellipsis/></span>
			</button>
		</mk-posts>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';
import parse from '../../../common/scripts/parse-search-query';

const limit = 20;

export default Vue.extend({
	data() {
		return {
			fetching: true,
			existMore: false,
			posts: [],
			offset: 0
		};
	},
	watch: {
		$route: 'fetch'
	},
	computed: {
		q(): string {
			return this.$route.query.q;
		}
	},
	mounted() {
		document.title = `%i18n:mobile.tags.mk-search-page.search%: ${this.q} | Misskey`;
		document.documentElement.style.background = '#313a42';

		this.fetch();
	},
	methods: {
		fetch() {
			this.fetching = true;
			Progress.start();

			(this as any).api('posts/search', Object.assign({
				limit: limit + 1
			}, parse(this.q))).then(posts => {
				if (posts.length == limit + 1) {
					posts.pop();
					this.existMore = true;
				}
				this.posts = posts;
				this.fetching = false;
				Progress.done();
			});
		},
		more() {
			this.offset += limit;
			(this as any).api('posts/search', Object.assign({
				limit: limit + 1,
				offset: this.offset
			}, parse(this.q))).then(posts => {
				if (posts.length == limit + 1) {
					posts.pop();
				} else {
					this.existMore = false;
				}
				this.posts = this.posts.concat(posts);
			});
		}
	}
});
</script>

<style lang="stylus" module>
.posts
	margin 8px auto
	max-width 500px
	width calc(100% - 16px)
	background #fff
	border-radius 8px
	box-shadow 0 0 0 1px rgba(0, 0, 0, 0.2)

	@media (min-width 500px)
		margin 16px auto
		width calc(100% - 32px)
</style>
