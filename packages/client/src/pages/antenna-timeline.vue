<template>
<div ref="rootEl" v-hotkey.global="keymap" v-size="{ min: [800] }" class="tqmomfks">
	<div v-if="queue > 0" class="new"><button class="_buttonPrimary" @click="top()">{{ $ts.newNoteRecived }}</button></div>
	<div class="tl _block">
		<XTimeline ref="tlComponent" :key="antennaId"
			class="tl"
			src="antenna"
			:antenna="antennaId"
			:sound="true"
			@queue="queueUpdated"
		/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import * as Misskey from 'misskey-js';
import XTimeline from '@/components/timeline.vue';
import { scroll } from '@/scripts/scroll';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';
import { router } from '@/router';

const props = defineProps<{
	antennaId: string;
}>();

let antenna: Misskey.entities.Antenna | null = $ref(null);
let queue = $ref(0);
let tlComponent = $ref<InstanceType<typeof XTimeline>>();
let rootEl = $ref<HTMLElement>();

watch(() => props.antennaId, async () => {
	antenna = await os.api('antennas/show', {
		antennaId: props.antennaId
	});
}, { immediate: true, });

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
	tlComponent.timetravel(date);
}

function settings() {
	router.push(`/my/antennas/${props.antennaId}`);
}

function focus() {
	tlComponent?.focus();
}

defineExpose({
	[symbols.PAGE_INFO]: computed(() => antenna ? {
		title: antenna.name,
		icon: 'fas fa-satellite',
		bg: 'var(--bg)',
		actions: [{
			icon: 'fas fa-calendar-alt',
			text: i18n.ts.jumpToSpecifiedDate,
			handler: timetravel
		}, {
			icon: 'fas fa-cog',
			text: i18n.ts.settings,
			handler: settings
		}],
	} : null),
});

</script>

<style lang="scss" scoped>
.tqmomfks {
	padding: var(--margin);

	> .new {
		position: sticky;
		top: calc(var(--stickyTop, 0px) + 16px);
		z-index: 1000;
		width: 100%;

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

	&.min-width_800px {
		max-width: 800px;
		margin: 0 auto;
	}
}
</style>
