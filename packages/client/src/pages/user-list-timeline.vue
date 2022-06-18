<template>
<div ref="rootEl" v-hotkey.global="keymap" v-size="{ min: [800] }" class="eqqrhokj">
	<div v-if="queue > 0" class="new"><button class="_buttonPrimary" @click="top()">{{ $ts.newNoteRecived }}</button></div>
	<div class="tl _block">
		<XTimeline
			ref="tlEl" :key="listId"
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
import { computed, watch, inject } from 'vue';
import XTimeline from '@/components/timeline.vue';
import { scroll } from '@/scripts/scroll';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { mainRouter } from '@/router';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { Router } from '@/nirax';

const router: Router = inject('router') ?? mainRouter;

const props = defineProps<{
	listId: string;
}>();

let list = $ref(null);
let queue = $ref(0);
let tlEl = $ref<InstanceType<typeof XTimeline>>();
let rootEl = $ref<HTMLElement>();

watch(() => props.listId, async () => {
	list = await os.api('users/lists/show', {
		listId: props.listId,
	});
}, { immediate: true });

function queueUpdated(q) {
	queue = q;
}

function top() {
	scroll(rootEl, { top: 0 });
}

function settings() {
	router.push(`/my/lists/${props.listId}`);
}

async function timetravel() {
	const { canceled, result: date } = await os.inputDate({
		title: i18n.ts.date,
	});
	if (canceled) return;

	tlEl.timetravel(date);
}

definePageMetadata(computed(() => list ? {
	title: list.name,
	icon: 'fas fa-list-ul',
	bg: 'var(--bg)',
	actions: [{
		icon: 'fas fa-calendar-alt',
		text: i18n.ts.jumpToSpecifiedDate,
		handler: timetravel,
	}, {
		icon: 'fas fa-cog',
		text: i18n.ts.settings,
		handler: settings,
	}],
} : null));
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
