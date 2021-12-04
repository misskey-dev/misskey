<template>
<MkContainer :show-header="props.showHeader" :style="`height: ${props.height}px;`" :scrollable="true">
	<template #header>
		<button class="_button" @click="choose">
			<i v-if="props.src === 'home'" class="fas fa-home"></i>
			<i v-else-if="props.src === 'local'" class="fas fa-comments"></i>
			<i v-else-if="props.src === 'social'" class="fas fa-share-alt"></i>
			<i v-else-if="props.src === 'global'" class="fas fa-globe"></i>
			<i v-else-if="props.src === 'list'" class="fas fa-list-ul"></i>
			<i v-else-if="props.src === 'antenna'" class="fas fa-satellite"></i>
			<span style="margin-left: 8px;">{{ props.src === 'list' ? props.list.name : props.src === 'antenna' ? props.antenna.name : $t('_timelines.' + props.src) }}</span>
			<i :class="menuOpened ? 'fas fa-angle-up' : 'fas fa-angle-down'" style="margin-left: 8px;"></i>
		</button>
	</template>

	<div>
		<XTimeline :key="props.src === 'list' ? `list:${props.list.id}` : props.src === 'antenna' ? `antenna:${props.antenna.id}` : props.src" :src="props.src" :list="props.list ? props.list.id : null" :antenna="props.antenna ? props.antenna.id : null"/>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkContainer from '@/components/ui/container.vue';
import XTimeline from '@/components/timeline.vue';
import define from './define';
import * as os from '@/os';

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
	components: {
		MkContainer,
		XTimeline,
	},
	extends: widget,

	data() {
		return {
			menuOpened: false,
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
				icon: 'fas fa-satellite',
				action: () => {
					this.props.antenna = antenna;
					this.setSrc('antenna');
				}
			}));
			const listItems = lists.map(list => ({
				text: list.name,
				icon: 'fas fa-list-ul',
				action: () => {
					this.props.list = list;
					this.setSrc('list');
				}
			}));
			os.popupMenu([{
				text: this.$ts._timelines.home,
				icon: 'fas fa-home',
				action: () => { this.setSrc('home') }
			}, {
				text: this.$ts._timelines.local,
				icon: 'fas fa-comments',
				action: () => { this.setSrc('local') }
			}, {
				text: this.$ts._timelines.social,
				icon: 'fas fa-share-alt',
				action: () => { this.setSrc('social') }
			}, {
				text: this.$ts._timelines.global,
				icon: 'fas fa-globe',
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
