<template>
<div class="oxgbmvii">
	<div class="notes">
		<header>
			<span><fa icon="search"/> {{ q }}</span>
		</header>
		<p v-if="!fetching && notAvailable">{{ $t('not-available') }}</p>
		<p v-if="!fetching && empty"><fa icon="search"/> {{ $t('not-found', { q }) }}</p>
		<mk-notes ref="timeline" :make-promise="makePromise" @inited="inited"/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';

const limit = 20;

export default Vue.extend({
	i18n: i18n('desktop/views/pages/search.vue'),
	data() {
		return {
			fetching: true,
			notAvailable: false,
			makePromise: cursor => this.$root.api('notes/search', {
				limit: limit + 1,
				offset: cursor ? cursor : undefined,
				query: this.q
			}).then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
					return {
						notes: notes,
						cursor: cursor ? cursor + limit : limit
					};
				} else {
					return {
						notes: notes,
						cursor: null
					};
				}
			})
		};
	},
	computed: {
		q(): string {
			return this.$route.query.q;
		}
	},
	watch: {
		$route: 'fetch'
	},
	mounted() {
		document.addEventListener('keydown', this.onDocumentKeydown);
		window.addEventListener('scroll', this.onScroll, { passive: true });
		Progress.start();
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
		inited() {
			this.fetching = false;
			Progress.done();
		},
	}
});
</script>

<style lang="stylus" scoped>
.oxgbmvii
	> .notes
		background var(--face)
		box-shadow var(--shadow)
		border-radius var(--round)
		overflow hidden

		> header
			padding 0 8px
			z-index 10
			background var(--faceHeader)
			box-shadow 0 var(--lineWidth) var(--desktopTimelineHeaderShadow)

			> span
				padding 0 8px
				font-size 0.9em
				line-height 42px
				color var(--text)
</style>
