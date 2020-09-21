<template>
<XColumn :menu="menu" :column="column" :is-stacked="isStacked">
	<template #header>
		<Fa :icon="faSatellite"/><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<XTimeline v-if="column.antennaId" ref="timeline" src="antenna" :antenna="column.antennaId" @after="() => $emit('loaded')"/>
</XColumn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faSatellite, faCog } from '@fortawesome/free-solid-svg-icons';
import XColumn from './column.vue';
import XTimeline from '../timeline.vue';
import * as os from '@/os';

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
			text: this.$t('selectAntenna'),
			action: this.setAntenna
		}];
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
				title: this.$t('selectAntenna'),
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
			Vue.set(this.column, 'antennaId', antenna.id);
			this.$store.commit('deviceUser/updateDeckColumn', this.column);
		},

		focus() {
			(this.$refs.timeline as any).focus();
		}
	}
});
</script>

<style lang="scss" scoped>
</style>
