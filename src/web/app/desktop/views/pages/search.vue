<template>
<mk-ui>
	<header :class="$style.header">
		<h1>{{ query }}</h1>
	</header>
	<div :class="$style.loading" v-if="fetching">
		<mk-ellipsis-icon/>
	</div>
	<p :class="$style.empty" v-if="empty">%fa:search%「{{ query }}」に関する投稿は見つかりませんでした。</p>
	<mk-posts ref="timeline" :class="$style.posts">
		<div slot="footer">
			<template v-if="!moreFetching">%fa:search%</template>
			<template v-if="moreFetching">%fa:spinner .pulse .fw%</template>
		</div>
	</mk-posts>
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
			moreFetching: false,
			offset: 0,
			posts: []
		};
	},
	computed: {
		empty(): boolean {
			return this.posts.length == 0;
		}
	},
	mounted() {
		Progress.start();

		document.addEventListener('keydown', this.onDocumentKeydown);
		window.addEventListener('scroll', this.onScroll);

		(this as any).api('posts/search', parse(this.query)).then(posts => {
			this.fetching = false;
			this.posts = posts;
		});
	},
	beforeDestroy() {
		document.removeEventListener('keydown', this.onDocumentKeydown);
		window.removeEventListener('scroll', this.onScroll);
	},
	methods: {
		onDocumentKeydown(e) {
			if (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
				if (e.which == 84) { // t
					(this.$refs.timeline as any).focus();
				}
			}
		},
		more() {
			if (this.moreFetching || this.fetching || this.posts.length == 0) return;
			this.offset += limit;
			this.moreFetching = true;
			return (this as any).api('posts/search', Object.assign({}, parse(this.query), {
				limit: limit,
				offset: this.offset
			})).then(posts => {
				this.moreFetching = false;
				this.posts = this.posts.concat(posts);
			});
		},
		onScroll() {
			const current = window.scrollY + window.innerHeight;
			if (current > document.body.offsetHeight - 16) this.more();
		}
	}
});
</script>

<style lang="stylus" module>
.header
	width 100%
	max-width 600px
	margin 0 auto
	color #555

.posts
	max-width 600px
	margin 0 auto
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px
	overflow hidden

.loading
	padding 64px 0

.empty
	display block
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

</style>
