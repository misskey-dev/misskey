<template>
<mk-ui>
	<span slot="header">%fa:search% {{ query }}</span>
	<main v-if="!fetching">
		<mk-posts :class="$style.posts" :posts="posts">
			<span v-if="posts.length == 0">{{ '%i18n:mobile.tags.mk-search-posts.empty%'.replace('{}', query) }}</span>
			<button v-if="canFetchMore" @click="more" :disabled="fetching" slot="tail">
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

const limit = 30;

export default Vue.extend({
	props: ['query'],
	data() {
		return {
			fetching: true,
			posts: [],
			offset: 0
		};
	},
	mounted() {
		document.title = `%i18n:mobile.tags.mk-search-page.search%: ${this.query} | Misskey`;
		document.documentElement.style.background = '#313a42';

		Progress.start();

		(this as any).api('posts/search', Object.assign({}, parse(this.query), {
			limit: limit
		})).then(posts => {
			this.posts = posts;
			this.fetching = false;
			Progress.done();
		});
	},
	methods: {
		more() {
			this.offset += limit;
			return (this as any).api('posts/search', Object.assign({}, parse(this.query), {
				limit: limit,
				offset: this.offset
			}));
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
