<template>
<MkContainer :show-header="props.showHeader" :style="`height: ${props.height}px;`" :scrollable="true">
	<template #header>
		<button @click="choose" class="_button">
			<Fa v-if="props.src === 'home'" :icon="faHome"/>
			<Fa v-if="props.src === 'local'" :icon="faComments"/>
			<Fa v-if="props.src === 'social'" :icon="faShareAlt"/>
			<Fa v-if="props.src === 'global'" :icon="faGlobe"/>
			<Fa v-if="props.src === 'list'" :icon="faListUl"/>
			<Fa v-if="props.src === 'antenna'" :icon="faSatellite"/>
			<span style="margin-left: 8px;">{{ props.src === 'list' ? props.list.name : props.src === 'antenna' ? props.antenna.name : $t('_timelines.' + props.src) }}</span>
			<Fa :icon="menuOpened ? faAngleUp : faAngleDown" style="margin-left: 8px;"/>
		</button>
	</template>

	<div>
		<XTimeline :key="props.src === 'list' ? `list:${props.list.id}` : props.src === 'antenna' ? `antenna:${props.antenna.id}` : props.src" :src="props.src" :list="props.list ? props.list.id : null" :antenna="props.antenna ? props.antenna.id : null"/>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faAngleDown, faAngleUp, faHome, faShareAlt, faGlobe, faListUl, faSatellite } from '@fortawesome/free-solid-svg-icons';
import { faComments } from '@fortawesome/free-regular-svg-icons';
import MkContainer from '@client/components/ui/container.vue';
import XTimeline from '@client/components/timeline.vue';
import define from './define';
import * as os from '@client/os';

const widget = define({
	name: 'timeline',
	props: () => ({
		showHeader: {
			type: 'boolean',
			default: true,
		},
		height: {
			type: 'number',
			default: 300,
		},
		src: {
			type: 'string',
			default: 'home',
			hidden: true,
		},
		list: {
			type: 'object',
			default: null,
			hidden: true,
		},
	})
});

export default defineComponent({
	extends: widget,
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
		async choose(ev) {
			this.menuOpened = true;
			const [antennas, lists] = await Promise.all([
				os.api('antennas/list'),
				os.api('users/lists/list')
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
			os.modalMenu([{
				text: this.$ts._timelines.home,
				icon: faHome,
				action: () => { this.setSrc('home') }
			}, {
				text: this.$ts._timelines.local,
				icon: faComments,
				action: () => { this.setSrc('local') }
			}, {
				text: this.$ts._timelines.social,
				icon: faShareAlt,
				action: () => { this.setSrc('social') }
			}, {
				text: this.$ts._timelines.global,
				icon: faGlobe,
				action: () => { this.setSrc('global') }
			}, antennaItems.length > 0 ? null : undefined, ...antennaItems, listItems.length > 0 ? null : undefined, ...listItems], ev.currentTarget || ev.target).then(() => {
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
