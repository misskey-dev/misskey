<template>
<div class="mkw-timeline" :style="`flex-basis: calc(${basis}% - var(--margin)); height: ${previewHeight}px;`">
	<mk-container :show-header="!props.compact" class="container">
		<template #header>
			<button @click="choose" class="_button">
				<fa v-if="props.src === 'home'" :icon="faHome"/>
				<fa v-if="props.src === 'local'" :icon="faComments"/>
				<fa v-if="props.src === 'social'" :icon="faShareAlt"/>
				<fa v-if="props.src === 'global'" :icon="faGlobe"/>
				<fa v-if="props.src === 'list'" :icon="faListUl"/>
				<fa v-if="props.src === 'antenna'" :icon="faSatellite"/>
				<span style="margin-left: 8px;">{{ props.src === 'list' ? props.list.name : props.src === 'antenna' ? props.antenna.name : $t('_timelines.' + props.src) }}</span>
				<fa :icon="menuOpened ? faAngleUp : faAngleDown" style="margin-left: 8px;"/>
			</button>
		</template>

		<div>
			<x-timeline :key="props.src === 'list' ? `list:${props.list.id}` : props.src === 'antenna' ? `antenna:${props.antenna.id}` : props.src" :src="props.src" :list="props.list" :antenna="props.antenna"/>
		</div>
	</mk-container>
</div>
</template>

<script lang="ts">
import { faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faListUl, faSatellite } from '@fortawesome/free-solid-svg-icons';
import { faComments } from '@fortawesome/free-regular-svg-icons';
import MkContainer from '../components/ui/container.vue';
import XTimeline from '../components/timeline.vue';
import define from './define';

const basisSteps = [25, 50, 75, 100]
const previewHeights = [200, 300, 400, 500]

export default define({
	name: 'timeline',
	props: () => ({
		src: 'home',
		list: null,
		compact: false,
		basisStep: 0
	})
}).extend({
	
	components: {
		MkContainer,
		XTimeline,
	},

	data() {
		return {
			menuOpened: false,
			faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faComments, faListUl, faSatellite
		};
	},

	computed: {
		basis(): number {
			return basisSteps[this.props.basisStep] || 25
		},

		previewHeight(): number {
			return previewHeights[this.props.basisStep] || 200
		}
	},

	methods: {
		func() {
			if (this.props.basisStep === basisSteps.length - 1) {
				this.props.basisStep = 0
				this.props.compact = !this.props.compact;
			} else {
				this.props.basisStep += 1
			}

			this.save();
		},

		async choose(ev) {
			this.menuOpened = true;
			const [antennas, lists] = await Promise.all([
				this.$root.api('antennas/list'),
				this.$root.api('users/lists/list')
			]);
			const antennaItems = antennas.map(antenna => ({
				text: antenna.name,
				icon: faSatellite,
				action: () => {
					this.props.antenna = antenna;
					this.setSrc('antenna');
				}
			}));
			const listItems = lists.map(list => ({
				text: list.name,
				icon: faListUl,
				action: () => {
					this.props.list = list;
					this.setSrc('list');
				}
			}));
			this.$root.menu({
				items: [{
					text: this.$t('_timelines.home'),
					icon: faHome,
					action: () => { this.setSrc('home') }
				}, {
					text: this.$t('_timelines.local'),
					icon: faComments,
					action: () => { this.setSrc('local') }
				}, {
					text: this.$t('_timelines.social'),
					icon: faShareAlt,
					action: () => { this.setSrc('social') }
				}, {
					text: this.$t('_timelines.global'),
					icon: faGlobe,
					action: () => { this.setSrc('global') }
				}, antennaItems.length > 0 ? null : undefined, ...antennaItems, listItems.length > 0 ? null : undefined, ...listItems],
				noCenter: true,
				source: ev.currentTarget || ev.target
			}).then(() => {
				this.menuOpened = false;
			});
		},

		setSrc(src) {
			this.props.src = src;
			this.save();
		},
	}
});
</script>

<style lang="scss" scoped>
.mkw-timeline {
	flex-grow: 1;
	flex-shrink: 0;
	min-height: 0; // https://www.gwtcenter.com/min-height-required-on-firefox-flexbox

	.container {
		display: flex;
		flex-direction: column;
		height: 100%;

		> div {
			overflow: auto;
			flex-grow: 1;
		}
	}
}
</style>
