<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<MkAntennaEditor v-if="antenna" :antenna="antenna" @updated="onAntennaUpdated"/>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkAntennaEditor from '@/components/MkAntennaEditor.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { antennasCache } from '@/cache.js';
import { useRouter } from '@/router.js';

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

const headerActions = computed(() => antenna.value ? [{
	icon: 'ti ti-timeline',
	text: i18n.ts.timeline,
	handler: () => {
		router.push('/timeline/antenna/:antennaId', {
			params: {
				antennaId: antenna.value!.id,
			},
		});
	},
}] : []);
const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.editAntenna,
	icon: 'ti ti-antenna',
}));
</script>
