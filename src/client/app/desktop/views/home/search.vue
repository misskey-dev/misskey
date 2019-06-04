<template>
<div>
	<mk-notes ref="timeline" :pagination="pagination" @inited="inited">
		<template #header>
			<header class="oxgbmvii">
				<span><fa icon="search"/> {{ q }}</span>
			</header>
		</template>
	</mk-notes>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';
import { genSearchQuery } from '../../../common/scripts/gen-search-query';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/search.vue'),
	data() {
		return {
			pagination: {
				endpoint: 'notes/search',
				limit: 20,
				params: () => genSearchQuery(this, this.q)
			}
		};
	},
	computed: {
		q(): string {
			return this.$route.query.q;
		}
	},
	watch: {
		$route() {
			this.$refs.timeline.reload();
		}
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
					(this.$refs.timeline as unknown).focus();
				}
			}
		},
		inited() {
			Progress.done();
		},
	}
});
</script>

<style lang="stylus" scoped>
.oxgbmvii
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
