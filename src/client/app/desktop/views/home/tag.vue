<template>
<div>
	<mk-notes ref="timeline" :pagination="pagination" @inited="inited">
		<template #header>
			<header class="wqraeznr">
				<span><fa icon="hashtag"/> {{ $route.params.tag }}</span>
			</header>
		</template>
	</mk-notes>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/tag.vue'),
	data() {
		return {
			pagination: {
				endpoint: 'notes/search-by-tag',
				limit: 20,
				params: {
					tag: this.$route.params.tag
				}
			}
		};
	},
	watch: {
		$route() {
			this.$refs.timeline.reload();
		}
	},
	mounted() {
		document.addEventListener('keydown', this.onDocumentKeydown);
		Progress.start();
	},
	beforeDestroy() {
		document.removeEventListener('keydown', this.onDocumentKeydown);
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
			Progress.done();
		},
	}
});
</script>

<style lang="stylus" scoped>
.wqraeznr
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
