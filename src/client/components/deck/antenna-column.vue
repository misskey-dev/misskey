<template>
<x-column :menu="menu" :column="column" :is-stacked="isStacked">
	<template #header>
		<fa :icon="faSatellite"/><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<x-timeline ref="timeline" src="antenna" :antenna="column.antennaId" @after="() => $emit('loaded')"/>
</x-column>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faSatellite, faCog } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import XTimeline from '../timeline.vue';

export default defineComponent({
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
			menu: null,
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
			icon: faCog,
			text: this.$t('antenna'),
			action: async () => {
				const antennas = await this.$root.api('antennas/list');
				this.$root.dialog({
					title: this.$t('antenna'),
					type: null,
					select: {
						items: antennas.map(x => ({
							value: x, text: x.name
						}))
					},
					showCancelButton: true
				}).then(({ canceled, result: antenna }) => {
					if (canceled) return;
					this.column.antennaId = antenna.id;
					this.$store.commit('deviceUser/updateDeckColumn', this.column);
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
