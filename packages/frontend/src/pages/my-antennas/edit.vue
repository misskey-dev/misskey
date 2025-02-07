<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>

	<MkAntennaEditor v-if="antenna" :antenna="antenna" @updated="onAntennaUpdated"/>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkAntennaEditor from '@/components/MkAntennaEditor.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { antennasCache } from '@/cache.js';
import { useRouter } from '@/router/supplier.js';

const router = useRouter();

const antenna = ref<Misskey.entities.Antenna | null>(null);

const props = defineProps<{
	antennaId: string
}>();

function onAntennaUpdated() {
	antennasCache.delete();
	router.push('/my/antennas');
}

misskeyApi('antennas/show', { antennaId: props.antennaId }).then((antennaResponse) => {
	antenna.value = antennaResponse;
});

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.editAntenna,
	icon: 'ti ti-antenna',
}));
</script>
