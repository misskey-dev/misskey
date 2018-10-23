<template>
<mk-ui>
	<header :class="$style.header">
		<h1>{{ q }}</h1>
	</header>
	<p :class="$style.notAvailable" v-if="!fetching && notAvailable">%i18n:@not-available%</p>
	<p :class="$style.empty" v-if="!fetching && empty">%fa:search% {{ '%i18n:not-found%'.split('{}')[0] }}{{ q }}{{ '%i18n:not-found%'.split('{}')[1] }}</p>
	<mk-notes ref="timeline" :class="$style.notes" :more="existMore ? more : null"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';

const limit = 20;

export default Vue.extend({
	data() {
		return {
			fetching: true,
			moreFetching: false,
			existMore: false,
			offset: 0,
			empty: false,
			notAvailable: false
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
				(this as any).api('notes/search', {
					limit: limit + 1,
					offset: this.offset,
					query: this.q
				}).then(notes => {
					if (notes.length == 0) this.empty = true;
					if (notes.length == limit + 1) {
						notes.pop();
						this.existMore = true;
					}
					res(notes);
					this.fetching = false;
					Progress.done();
				}, (e: string) => {
					this.fetching = false;
					Progress.done();
					if (e === 'searching not available') this.notAvailable = true;
				});
			}));
		},
		more() {
			this.offset += limit;

			const promise = (this as any).api('notes/search', {
				limit: limit + 1,
				offset: this.offset,
				query: this.q
			});

			promise.then(notes => {
				if (notes.length == limit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				notes.forEach(n => (this.$refs.timeline as any).append(n));
				this.moreFetching = false;
			});

			return promise;
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

.notes
	max-width 600px
	margin 0 auto
	border solid 1px rgba(#000, 0.075)
	border-radius 6px
	overflow hidden

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


.notAvailable
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
