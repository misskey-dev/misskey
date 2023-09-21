<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<div ref="rootEl" v-hotkey.global="keymap" class="tqmomfks">
		<div v-if="queue > 0" class="new"><button class="_buttonPrimary" @click="top()">{{ i18n.ts.newNoteRecived }}</button></div>
		<div class="tl">
			<MkTimeline
				ref="tlEl" :key="antennaId"
				class="tl"
				src="antenna"
				:antenna="antennaId"
				:sound="true"
				@queue="queueUpdated"
			/>
		</div>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import MkTimeline from '@/components/MkTimeline.vue';
import { scroll } from '@/scripts/scroll';
import * as os from '@/os';
import { useRouter } from '@/router';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';

const router = useRouter();

const props = defineProps<{
	antennaId: string;
}>();

let antenna = $ref(null);
let queue = $ref(0);
let rootEl = $shallowRef<HTMLElement>();
let tlEl = $shallowRef<InstanceType<typeof MkTimeline>>();
const keymap = $computed(() => ({
	't': focus,
}));

function queueUpdated(q) {
	queue = q;
}

function top() {
	scroll(rootEl, { top: 0 });
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

<style lang="scss" scoped>
.tqmomfks {
	padding: var(--margin);

	> .new {
		position: sticky;
		top: calc(var(--stickyTop, 0px) + 16px);
		z-index: 1000;
		width: 100%;
		margin: calc(-0.675em - 8px - var(--margin)) 0 calc(-0.675em - 8px);

		> button {
			display: block;
			margin: var(--margin) auto 0 auto;
			padding: 8px 16px;
			border-radius: 32px;
		}
	}

	> .tl {
		background: var(--bg);
		border-radius: var(--radius);
		overflow: clip;
	}
}

@container (min-width: 800px) {
	.tqmomfks {
		max-width: 800px;
		margin: 0 auto;
	}
}
</style>
