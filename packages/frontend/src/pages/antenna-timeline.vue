<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div :class="$style.tl">
			<MkStreamingNotesTimeline
				ref="tlEl" :key="antennaId"
				src="antenna"
				:antenna="antennaId"
				:sound="true"
			/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkStreamingNotesTimeline from '@/components/MkStreamingNotesTimeline.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router.js';

const router = useRouter();

const props = defineProps<{
	antennaId: string;
}>();

const antenna = ref<Misskey.entities.Antenna | null>(null);
const tlEl = useTemplateRef('tlEl');

function settings() {
	router.push('/my/antennas/:antennaId', {
		params: {
			antennaId: props.antennaId,
		},
	});
}

watch(() => props.antennaId, async () => {
	antenna.value = await misskeyApi('antennas/show', {
		antennaId: props.antennaId,
	});
}, { immediate: true });

const headerActions = computed(() => antenna.value ? [{
	icon: 'ti ti-settings',
	text: i18n.ts.settings,
	handler: settings,
}] : []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: antenna.value ? antenna.value.name : i18n.ts.antennas,
	icon: 'ti ti-antenna',
}));
</script>

<style lang="scss" module>
.tl {
	background: var(--MI_THEME-bg);
	border-radius: var(--MI-radius);
	overflow: clip;
}
</style>
