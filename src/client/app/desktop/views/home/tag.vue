<template>
<div>
	<p :class="$style.empty" v-if="!fetching && empty"><fa icon="search"/> {{ $t('no-posts-found', { q: $route.params.tag }) }}</p>
	<mk-notes ref="timeline" :class="$style.notes" :more="existMore ? more : null"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';

const limit = 20;

export default Vue.extend({
	i18n: i18n('desktop/views/pages/tag.vue'),
	data() {
		return {
			fetching: true,
			moreFetching: false,
			existMore: false,
			offset: 0,
			empty: false
		};
	},
	watch: {
		$route: 'fetch'
	},
	mounted() {
		document.addEventListener('keydown', this.onDocumentKeydown);
		window.addEventListener('scroll', this.onScroll, { passive: true });

		this.fetch();
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
		fetch() {
			this.fetching = true;
			Progress.start();

			(this.$refs.timeline as any).init(() => new Promise((res, rej) => {
				this.$root.api('notes/search_by_tag', {
					limit: limit + 1,
					offset: this.offset,
					tag: this.$route.params.tag
				}).then(notes => {
					if (notes.length == 0) this.empty = true;
					if (notes.length == limit + 1) {
						notes.pop();
						this.existMore = true;
					}
					res(notes);
					this.fetching = false;
					Progress.done();
				}, rej);
			}));
		},
		more() {
			this.offset += limit;

			const promise = this.$root.api('notes/search_by_tag', {
				limit: limit + 1,
				offset: this.offset,
				tag: this.$route.params.tag
			});

			promise.then(notes => {
				if (notes.length == limit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				for (const n of notes) {
					(this.$refs.timeline as any).append(n);
				}
				this.moreFetching = false;
			});

			return promise;
		}
	}
});
</script>

<style lang="stylus" module>
.notes
	background var(--face)
	box-shadow var(--shadow)
	border-radius var(--round)
	overflow hidden
	overflow hidden

.empty
	display block
	margin 0 auto
	padding 32px
	max-width 400px
	text-align center
	color #999

	> [data-icon]
		display block
		margin-bottom 16px
		font-size 3em
		color #ccc

</style>
