<template>
<x-column :menu="menu" :column="column" :is-stacked="isStacked">
	<template #header>
		<fa :icon="faSatellite"/><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<x-timeline ref="timeline" src="antenna" @after="() => $emit('loaded')"/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import { faSatellite } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import XTimeline from '../timeline.vue';

export default Vue.extend({
	components: {
		XColumn,
		XTimeline,
	},

	props: {
		column: {
			type: Object,
			required: true
		},
		isStacked: {
			type: Boolean,
			required: true
		}
	},

	data() {
		return {
			faSatellite
		};
	},

	watch: {
		mediaOnly() {
			(this.$refs.timeline as any).reload();
		}
	},

	created() {
		this.menu = [{
			icon: 'cog',
			text: this.$t('antenna'),
			action: () => {
				const antennas = this.$root.api('antennas/list');
				const antennaItems = antennas.map(antenna => ({
					text: antenna.name,
					icon: faSatellite,
					action: () => {
						this.props.antenna = antenna;
						this.setSrc('antenna');
					}
				}));
				this.$root.dialog({
					title: this.$t('antenna'),
					type: null,
					select: {
						items: antennaItems.map(x => ({
							value: x, text: x.name
						}))
					},
					showCancelButton: true
				}).then(({ canceled, result: antenna }) => {
					if (canceled) return;
					this.column.antenna = antenna.id;
					this.$store.commit('updateDeckColumn', this.column);
				});
			}
		}];
	},

	methods: {
		focus() {
			(this.$refs.timeline as any).focus();
		}
	}
});
</script>

<style lang="scss" scoped>
</style>
