<template>
<div class="mk-home">
	<portal to="header">
		<button @click="choose" class="_button _kjvfvyph_">
			<fa v-if="src === 'home'" :icon="faHome"/>
			<fa v-if="src === 'local'" :icon="faComments"/>
			<fa v-if="src === 'social'" :icon="faShareAlt"/>
			<fa v-if="src === 'global'" :icon="faGlobe"/>
			<span style="margin-left: 8px;">{{ $t('_timelines.' + src) }}</span>
			<fa :icon="menuOpened ? faAngleUp : faAngleDown" style="margin-left: 8px;"/>
		</button>
	</portal>
	<x-home-timeline @before="before()" @after="after()"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { faComments } from '@fortawesome/free-regular-svg-icons';
import Progress from '../scripts/loading';
import XHomeTimeline from './index.home.timeline.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('timeline')
		};
	},
	components: {
		XHomeTimeline
	},
	data() {
		return {
			src: 'home',
			menuOpened: false,
			faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faComments
		};
	},
	methods: {
		before() {
			Progress.start();
		},
		after() {
			Progress.done();
		},
		choose(ev) {
			this.menuOpened = true;
			this.$root.menu({
				items: [{
					type: 'item',
					text: this.$t('_timelines.home'),
					icon: faHome,
					action: () => { this.setSrc('home') }
				}, {
					type: 'item',
					text: this.$t('_timelines.local'),
					icon: faComments,
					action: () => { this.setSrc('local') }
				}, {
					type: 'item',
					text: this.$t('_timelines.social'),
					icon: faShareAlt,
					action: () => { this.setSrc('social') }
				}, {
					type: 'item',
					text: this.$t('_timelines.global'),
					icon: faGlobe,
					action: () => { this.setSrc('global') }
				}],
				source: ev.currentTarget || ev.target
			}).then(() => {
				this.menuOpened = false;
			});
		}
	}
});
</script>

<style lang="scss">
@import '../theme';

._kjvfvyph_ {
	height: 100%;
	font-weight: bold;
}
</style>
