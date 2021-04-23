<template>
<XColumn :func="{ handler: setAntenna, title: $ts.selectAntenna }" :column="column" :is-stacked="isStacked">
	<template #header>
		<i class="fas fa-satellite"></i><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<XTimeline v-if="column.antennaId" ref="timeline" src="antenna" :antenna="column.antennaId" @after="() => $emit('loaded')"/>
</XColumn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XColumn from './column.vue';
import XTimeline from '@client/components/timeline.vue';
import * as os from '@client/os';
import { updateColumn } from './deck-store';

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
		};
	},

	watch: {
		mediaOnly() {
			(this.$refs.timeline as any).reload();
		}
	},

	mounted() {
		if (this.column.antennaId == null) {
			this.setAntenna();
		}
	},

	methods: {
		async setAntenna() {
			const antennas = await os.api('antennas/list');
			const { canceled, result: antenna } = await os.dialog({
				title: this.$ts.selectAntenna,
				type: null,
				select: {
					items: antennas.map(x => ({
						value: x, text: x.name
					})),
				default: this.column.antennaId
				},
				showCancelButton: true
			});
			if (canceled) return;
			updateColumn(this.column.id, {
				antennaId: antenna.id
			});
		},

		focus() {
			(this.$refs.timeline as any).focus();
		}
	}
});
</script>

<style lang="scss" scoped>
</style>
