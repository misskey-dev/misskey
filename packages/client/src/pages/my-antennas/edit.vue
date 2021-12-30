<template>
<div class="">
	<XAntenna v-if="antenna" :antenna="antenna" @updated="onAntennaUpdated"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import XAntenna from './editor.vue';
import * as symbols from '@/symbols';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		XAntenna,
	},

	props: {
		antennaId: {
			type: String,
			required: true,
		}
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.manageAntennas,
				icon: 'fas fa-satellite',
			},
			antenna: null,
		};
	},

	watch: {
		antennaId: {
			async handler() {
				this.antenna = await os.api('antennas/show', { antennaId: this.antennaId });
			},
			immediate: true,
		}
	},

	methods: {
		onAntennaUpdated() {
			this.$router.push('/my/antennas');
		},
	}
});
</script>

<style lang="scss" scoped>

</style>
