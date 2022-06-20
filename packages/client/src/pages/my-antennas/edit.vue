<template>
<div class="">
	<XAntenna v-if="antenna" :antenna="antenna" @updated="onAntennaUpdated"/>
</div>
</template>

<script lang="ts" setup>
import { inject, watch } from 'vue';
import XAntenna from './editor.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { useRouter } from '@/router';
import { definePageMetadata } from '@/scripts/page-metadata';

const router = useRouter();

let antenna: any = $ref(null);

const props = defineProps<{
	antennaId: string
}>();

function onAntennaUpdated() {
	router.push('/my/antennas');
}

os.api('antennas/show', { antennaId: props.antennaId }).then((antennaResponse) => {
	antenna = antennaResponse;
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.manageAntennas,
	icon: 'fas fa-satellite',
});
</script>

<style lang="scss" scoped>

</style>
