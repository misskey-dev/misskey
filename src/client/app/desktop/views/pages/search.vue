<template>
<mk-ui>
	<header :class="$style.header">
		<h1>{{ q }}</h1>
	</header>
	<div :class="$style.loading" v-if="fetching">
		<mk-ellipsis-icon/>
	</div>
	<p :class="$style.empty" v-if="!fetching && empty">%fa:search%「{{ q }}」に関する投稿は見つかりませんでした。</p>
	<mk-notes ref="timeline" :class="$style.notes" :notes="notes">
		<div slot="footer">
			<template v-if="!moreFetching">%fa:search%</template>
			<template v-if="moreFetching">%fa:spinner .pulse .fw%</template>
		</div>
	</mk-notes>
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
			moreFetching: false,
			existMore: false,
			offset: 0,
			notes: []
		};
	},
	watch: {
		$route: 'fetch'
	},
	computed: {
		empty(): boolean {
			return this.notes.length == 0;
		},
		q(): string {
			return this.$route.query.q;
		}
	},
	mounted() {
		document.addEventListener('keydown', this.onDocumentKeydown);
		window.addEventListener('scroll', this.onScroll);

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

			(this as any).api('notes/search', Object.assign({
				limit: limit + 1,
				offset: this.offset
			}, parse(this.q))).then(notes => {
				if (notes.length == limit + 1) {
					notes.pop();
					this.existMore = true;
				}
				this.notes = notes;
				this.fetching = false;
				Progress.done();
			});
		},
		more() {
			if (this.moreFetching || this.fetching || this.notes.length == 0 || !this.existMore) return;
			this.offset += limit;
			this.moreFetching = true;
			return (this as any).api('notes/search', Object.assign({
				limit: limit + 1,
				offset: this.offset
			}, parse(this.q))).then(notes => {
				if (notes.length == limit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				this.notes = this.notes.concat(notes);
				this.moreFetching = false;
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

.notes
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
