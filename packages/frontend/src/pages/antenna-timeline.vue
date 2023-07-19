<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<div ref="rootEl" v-hotkey.global="keymap">
			<MkTimeline
				ref="tlEl" :key="antennaId"
				src="antenna"
				:antenna="antennaId"
				:sound="true"
				:class="$style.tl"
			/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import MkTimeline from '@/components/MkTimeline.vue';
import * as os from '@/os';
import { useRouter } from '@/router';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';

const router = useRouter();

const props = defineProps<{
	antennaId: string;
}>();

let antenna = $ref(null);
let rootEl = $shallowRef<HTMLElement>();
let tlEl = $shallowRef<InstanceType<typeof MkTimeline>>();
const keymap = $computed(() => ({
	't': focus,
}));

function top() {
	tlEl?.reload();
}

async function timetravel() {
	const { canceled, result: date } = await os.inputDate({
		title: i18n.ts.date,
	});
	if (canceled) return;

	tlEl.timetravel(date);
}

function settings() {
	router.push(`/my/antennas/${props.antennaId}`);
}

function focus() {
	tlEl.focus();
}

watch(() => props.antennaId, async () => {
	antenna = await os.api('antennas/show', {
		antennaId: props.antennaId,
	});
}, { immediate: true });

const headerActions = $computed(() => antenna ? [{
	icon: 'ti ti-calendar-time',
	text: i18n.ts.jumpToSpecifiedDate,
	handler: timetravel,
}, {
	icon: 'ti ti-settings',
	text: i18n.ts.settings,
	handler: settings,
}] : []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => antenna ? {
	title: antenna.name,
	icon: 'ti ti-antenna',
} : null));
</script>

<style lang="scss" module>
.tl {
	background: var(--bg);
	border-radius: var(--radius);
	overflow: clip;
}
</style>
