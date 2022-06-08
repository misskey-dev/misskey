<template>
<div class="">
	<XAntenna v-if="antenna" :antenna="antenna" @updated="onAntennaUpdated"/>
</div>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import XAntenna from './editor.vue';
import * as symbols from '@/symbols';
import * as os from '@/os';
import { MisskeyNavigator } from '@/scripts/navigate';
import { i18n } from '@/i18n';

const nav = new MisskeyNavigator();

let antenna: any = $ref(null);

const props = defineProps<{
	antennaId: string
}>();

function onAntennaUpdated() {
	nav.push('/my/antennas');
}

os.api('antennas/show', { antennaId: props.antennaId }).then((antennaResponse) => {
	antenna = antennaResponse;
});

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.manageAntennas,
		icon: 'fas fa-satellite',
	}
});
</script>

<style lang="scss" scoped>

</style>
