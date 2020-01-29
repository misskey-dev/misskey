<template>
<div class="mkw-timeline">
	<mk-container :show-header="!props.compact">
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

		<div style="height: 300px; padding: 8px; overflow: auto; background: var(--bg);">
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
import i18n from '../i18n';

export default define({
	name: 'timeline',
	props: () => ({
		src: 'home',
		list: null,
		compact: false
	})
}).extend({
	i18n,
	
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

	methods: {
		func() {
			this.props.compact = !this.props.compact;
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
