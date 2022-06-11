<template>
<MkSpacer :content-max="800">
	<div ref="rootEl" v-hotkey.global="keymap" class="cmuxhskf">
		<XTutorial v-if="$store.reactiveState.tutorial.value != -1" class="tutorial _block"/>
		<XPostForm v-if="$store.reactiveState.showFixedPostForm.value" class="post-form _block" fixed/>

		<div v-if="queue > 0" class="new"><button class="_buttonPrimary" @click="top()">{{ $ts.newNoteRecived }}</button></div>
		<div class="tl _block">
			<XTimeline ref="tl" :key="src"
				class="tl"
				:src="src"
				:sound="true"
				@queue="queueUpdated"
			/>
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts">
export default {
	name: 'MkTimelinePage',
};
</script>

<script lang="ts" setup>
import { defineAsyncComponent, computed, watch } from 'vue';
import XTimeline from '@/components/timeline.vue';
import XPostForm from '@/components/post-form.vue';
import { scroll } from '@/scripts/scroll';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import { instance } from '@/instance';
import { $i } from '@/account';

const XTutorial = defineAsyncComponent(() => import('./timeline.tutorial.vue'));

const isLocalTimelineAvailable = !instance.disableLocalTimeline || ($i != null && ($i.isModerator || $i.isAdmin));
const isGlobalTimelineAvailable = !instance.disableGlobalTimeline || ($i != null && ($i.isModerator || $i.isAdmin));
const keymap = {
	't': focus,
};

const tlComponent = $ref<InstanceType<typeof XTimeline>>();
const rootEl = $ref<HTMLElement>();

let queue = $ref(0);
const src = $computed(() => defaultStore.reactiveState.tl.value.src);

watch ($$(src), () => queue = 0);

function queueUpdated(q: number): void {
	queue = q;
}

function top(): void {
	scroll(rootEl, { top: 0 });
}

async function chooseList(ev: MouseEvent): Promise<void> {
	const lists = await os.api('users/lists/list');
	const items = lists.map(list => ({
		type: 'link' as const,
		text: list.name,
		to: `/timeline/list/${list.id}`,
	}));
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

async function chooseAntenna(ev: MouseEvent): Promise<void> {
	const antennas = await os.api('antennas/list');
	const items = antennas.map(antenna => ({
		type: 'link' as const,
		text: antenna.name,
		indicate: antenna.hasUnreadNote,
		to: `/timeline/antenna/${antenna.id}`,
	}));
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

async function chooseChannel(ev: MouseEvent): Promise<void> {
	const channels = await os.api('channels/followed');
	const items = channels.map(channel => ({
		type: 'link' as const,
		text: channel.name,
		indicate: channel.hasUnreadNote,
		to: `/channels/${channel.id}`,
	}));
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

function saveSrc(newSrc: 'home' | 'local' | 'social' | 'global'): void {
	defaultStore.set('tl', {
		...defaultStore.state.tl,
		src: newSrc,
	});
}

async function timetravel(): Promise<void> {
	const { canceled, result: date } = await os.inputDate({
		title: i18n.ts.date,
	});
	if (canceled) return;

	tlComponent.timetravel(date);
}

function focus(): void {
	tlComponent.focus();
}

defineExpose({
	[symbols.PAGE_INFO]: computed(() => ({
		title: i18n.ts.timeline,
		icon: src === 'local' ? 'fas fa-comments' : src === 'social' ? 'fas fa-share-alt' : src === 'global' ? 'fas fa-globe' : 'fas fa-home',
		bg: 'var(--bg)',
		actions: [{
			icon: 'fas fa-list-ul',
			text: i18n.ts.lists,
			handler: chooseList,
		}, {
			icon: 'fas fa-satellite',
			text: i18n.ts.antennas,
			handler: chooseAntenna,
		}, {
			icon: 'fas fa-satellite-dish',
			text: i18n.ts.channel,
			handler: chooseChannel,
		}, {
			icon: 'fas fa-calendar-alt',
			text: i18n.ts.jumpToSpecifiedDate,
			handler: timetravel,
		}],
		tabs: [{
			active: src === 'home',
			title: i18n.ts._timelines.home,
			icon: 'fas fa-home',
			iconOnly: true,
			onClick: () => { saveSrc('home'); },
		}, ...(isLocalTimelineAvailable ? [{
			active: src === 'local',
			title: i18n.ts._timelines.local,
			icon: 'fas fa-comments',
			iconOnly: true,
			onClick: () => { saveSrc('local'); },
		}, {
			active: src === 'social',
			title: i18n.ts._timelines.social,
			icon: 'fas fa-share-alt',
			iconOnly: true,
			onClick: () => { saveSrc('social'); },
		}] : []), ...(isGlobalTimelineAvailable ? [{
			active: src === 'global',
			title: i18n.ts._timelines.global,
			icon: 'fas fa-globe',
			iconOnly: true,
			onClick: () => { saveSrc('global'); },
		}] : [])],
	})),
});
</script>

<style lang="scss" scoped>
.cmuxhskf {
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

	> .post-form {
		border-radius: var(--radius);
	}

	> .tl {
		background: var(--bg);
		border-radius: var(--radius);
		overflow: clip;
	}
}
</style>
