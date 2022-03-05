<template>
<div ref="rootEl" v-hotkey.global="keymap" v-size="{ min: [800] }" class="eqqrhokj">
	<div v-if="queue > 0" class="new"><button class="_buttonPrimary" @click="top()">{{ $ts.newNoteRecived }}</button></div>
	<div class="tl _block">
		<XTimeline ref="tlComponent" :key="listId"
			class="tl"
			src="list"
			:list="listId"
			:sound="true"
			@queue="queueUpdated"
		/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import XTimeline from '@/components/timeline.vue';
import { scroll } from '@/scripts/scroll';
import * as os from '@/os';
import * as symbols from '@/symbols';

defineProps<{
	listId: string;
}>();

let list: null = $ref(null);
let queue: number = $ref(0);
let tlComponent = $ref<InstanceType<typeof XTimeline>>();
let rootEl = $ref<HTMLElement>();

const keymap = $computed(() => ({
	't': focus,
}));

watch(() => props.listId, async () => {
	list = await os.api('antennas/show', {
		listId: props.listId
	});
}, { immediate: true, });

function queueUpdated(q) {
	queue = q;
}

function top() {
	tlComponent.tlComponent.value.pagingComponent?.executeQueue();
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
	router.push(`/my/lists/${props.listId}`);
}

function focus() {
	tlComponent?.focus();
}

defineExpose({
	[symbols.PAGE_INFO]: computed(() => list ? {
		title: list.name,
		icon: 'fas fa-list-ul',
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
.eqqrhokj {
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
