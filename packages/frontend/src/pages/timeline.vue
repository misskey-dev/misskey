<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="src" :actions="headerActions" :tabs="$i ? headerTabs : headerTabsWhenNotLogin" :displayMyAvatar="true"/></template>
	<MkSpacer :contentMax="800">
		<div ref="rootEl" v-hotkey.global="keymap">
			<MkInfo v-if="['home', 'local', 'social', 'global'].includes(src) && !defaultStore.reactiveState.timelineTutorials.value[src]" style="margin-bottom: var(--margin);" closable @close="closeTutorial()">
				{{ i18n.ts._timelineDescription[src] }}
			</MkInfo>
			<MkPostForm v-if="defaultStore.reactiveState.showFixedPostForm.value" :class="$style.postForm" class="post-form _panel" fixed style="margin-bottom: var(--margin);"/>

			<div v-if="queue > 0" :class="$style.new"><button class="_buttonPrimary" :class="$style.newButton" @click="top()">{{ i18n.ts.newNoteRecived }}</button></div>
			<div :class="$style.tl">
				<MkTimeline
					ref="tlComponent"
					:key="src + withRenotes + withReplies + onlyFiles"
					:src="src.split(':')[0]"
					:list="src.split(':')[1]"
					:withRenotes="withRenotes"
					:withReplies="withReplies"
					:onlyFiles="onlyFiles"
					:sound="true"
					@queue="queueUpdated"
				/>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch, provide, shallowRef, ref } from 'vue';
import type { Tab } from '@/components/global/MkPageHeader.tabs.vue';
import MkTimeline from '@/components/MkTimeline.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkPostForm from '@/components/MkPostForm.vue';
import { scroll } from '@/scripts/scroll.js';
import * as os from '@/os.js';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { $i } from '@/account.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { antennasCache, userListsCache } from '@/cache.js';
import { deviceKind } from '@/scripts/device-kind.js';
import { MenuItem } from '@/types/menu.js';
import { miLocalStorage } from '@/local-storage.js';

provide('shouldOmitHeaderTitle', true);

const isLocalTimelineAvailable = ($i == null && instance.policies.ltlAvailable) || ($i != null && $i.policies.ltlAvailable);
const isGlobalTimelineAvailable = ($i == null && instance.policies.gtlAvailable) || ($i != null && $i.policies.gtlAvailable);
const keymap = {
	't': focus,
};

const tlComponent = shallowRef<InstanceType<typeof MkTimeline>>();
const rootEl = shallowRef<HTMLElement>();

const queue = ref(0);
const srcWhenNotSignin = ref(isLocalTimelineAvailable ? 'local' : 'global');
const src = computed({ get: () => ($i ? defaultStore.reactiveState.tl.value.src : srcWhenNotSignin.value), set: (x) => saveSrc(x) });
const withRenotes = ref(true);
const withReplies = ref($i ? defaultStore.state.tlWithReplies : false);
const onlyFiles = ref(false);

watch(src, () => queue.value = 0);

watch(withReplies, (x) => {
	if ($i) defaultStore.set('tlWithReplies', x);
});

function queueUpdated(q: number): void {
	queue.value = q;
}

function top(): void {
	if (rootEl.value) scroll(rootEl.value, { top: 0 });
}

async function chooseList(ev: MouseEvent): Promise<void> {
	const lists = await userListsCache.fetch();
	const items: MenuItem[] = [
		...lists.map(list => ({
			type: 'link' as const,
			text: list.name,
			to: `/timeline/list/${list.id}`,
		})),
		(lists.length === 0 ? undefined : { type: 'divider' }),
		{
			type: 'link' as const,
			icon: 'ti ti-plus',
			text: i18n.ts.createNew,
			to: '/my/lists',
		},
	];
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

async function chooseAntenna(ev: MouseEvent): Promise<void> {
	const antennas = await antennasCache.fetch();
	const items: MenuItem[] = [
		...antennas.map(antenna => ({
			type: 'link' as const,
			text: antenna.name,
			indicate: antenna.hasUnreadNote,
			to: `/timeline/antenna/${antenna.id}`,
		})),
		(antennas.length === 0 ? undefined : { type: 'divider' }),
		{
			type: 'link' as const,
			icon: 'ti ti-plus',
			text: i18n.ts.createNew,
			to: '/my/antennas',
		},
	];
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

async function chooseChannel(ev: MouseEvent): Promise<void> {
	const channels = await os.api('channels/my-favorites', {
		limit: 100,
	});
	const items: MenuItem[] = [
		...channels.map(channel => {
			const lastReadedAt = miLocalStorage.getItemAsJson(`channelLastReadedAt:${channel.id}`) ?? null;
			const hasUnreadNote = (lastReadedAt && channel.lastNotedAt) ? Date.parse(channel.lastNotedAt) > lastReadedAt : !!(!lastReadedAt && channel.lastNotedAt);

			return {
				type: 'link' as const,
				text: channel.name,
				indicate: hasUnreadNote,
				to: `/channels/${channel.id}`,
			};
		}),
		(channels.length === 0 ? undefined : { type: 'divider' }),
		{
			type: 'link' as const,
			icon: 'ti ti-plus',
			text: i18n.ts.createNew,
			to: '/channels',
		},
	];
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

function saveSrc(newSrc: 'home' | 'local' | 'social' | 'global' | `list:${string}`): void {
	let userList = null;
	if (newSrc.startsWith('userList:')) {
		const id = newSrc.substring('userList:'.length);
		userList = defaultStore.reactiveState.pinnedUserLists.value.find(l => l.id === id);
	}
	defaultStore.set('tl', {
		src: newSrc,
		userList,
	});
	srcWhenNotSignin.value = newSrc;
}

async function timetravel(): Promise<void> {
	const { canceled, result: date } = await os.inputDate({
		title: i18n.ts.date,
	});
	if (canceled) return;

	tlComponent.value.timetravel(date);
}

function focus(): void {
	tlComponent.value.focus();
}

function closeTutorial(): void {
	if (!['home', 'local', 'social', 'global'].includes(src.value)) return;
	const before = defaultStore.state.timelineTutorials;
	before[src.value] = true;
	defaultStore.set('timelineTutorials', before);
}

const headerActions = computed(() => {
	const tmp = [
		{
			icon: 'ti ti-dots',
			text: i18n.ts.options,
			handler: (ev) => {
				os.popupMenu([{
					type: 'switch',
					text: i18n.ts.showRenotes,
					ref: withRenotes,
				}, src.value === 'local' || src.value === 'social' ? {
					type: 'switch',
					text: i18n.ts.showRepliesToOthersInTimeline,
					ref: withReplies,
					disabled: onlyFiles,
				} : undefined, {
					type: 'switch',
					text: i18n.ts.fileAttachedOnly,
					ref: onlyFiles,
					disabled: src.value === 'local' || src.value === 'social' ? withReplies : false,
				}], ev.currentTarget ?? ev.target);
			},
		},
	];
	if (deviceKind === 'desktop') {
		tmp.unshift({
			icon: 'ti ti-refresh',
			text: i18n.ts.reload,
			handler: (ev: Event) => {
				console.log('called');
				tlComponent.value.reloadTimeline();
			},
		});
	}
	return tmp;
});

const headerTabs = computed(() => [...(defaultStore.reactiveState.pinnedUserLists.value.map(l => ({
	key: 'list:' + l.id,
	title: l.name,
	icon: 'ti ti-star',
	iconOnly: true,
}))), {
	key: 'home',
	title: i18n.ts._timelines.home,
	icon: 'ti ti-home',
	iconOnly: true,
}, ...(isLocalTimelineAvailable ? [{
	key: 'local',
	title: i18n.ts._timelines.local,
	icon: 'ti ti-planet',
	iconOnly: true,
}, {
	key: 'social',
	title: i18n.ts._timelines.social,
	icon: 'ti ti-universe',
	iconOnly: true,
}] : []), ...(isGlobalTimelineAvailable ? [{
	key: 'global',
	title: i18n.ts._timelines.global,
	icon: 'ti ti-whirl',
	iconOnly: true,
}] : []), {
	icon: 'ti ti-list',
	title: i18n.ts.lists,
	iconOnly: true,
	onClick: chooseList,
}, {
	icon: 'ti ti-antenna',
	title: i18n.ts.antennas,
	iconOnly: true,
	onClick: chooseAntenna,
}, {
	icon: 'ti ti-device-tv',
	title: i18n.ts.channel,
	iconOnly: true,
	onClick: chooseChannel,
}] as Tab[]);

const headerTabsWhenNotLogin = computed(() => [
	...(isLocalTimelineAvailable ? [{
		key: 'local',
		title: i18n.ts._timelines.local,
		icon: 'ti ti-planet',
		iconOnly: true,
	}] : []),
	...(isGlobalTimelineAvailable ? [{
		key: 'global',
		title: i18n.ts._timelines.global,
		icon: 'ti ti-whirl',
		iconOnly: true,
	}] : []),
] as Tab[]);

definePageMetadata(computed(() => ({
	title: i18n.ts.timeline,
	icon: src.value === 'local' ? 'ti ti-planet' : src.value === 'social' ? 'ti ti-universe' : src.value === 'global' ? 'ti ti-whirl' : 'ti ti-home',
})));
</script>

<style lang="scss" module>
.new {
	position: sticky;
	top: calc(var(--stickyTop, 0px) + 16px);
	z-index: 1000;
	width: 100%;
	margin: calc(-0.675em - 8px) 0;

	&:first-child {
		margin-top: calc(-0.675em - 8px - var(--margin));
	}
}

.newButton {
	display: block;
	margin: var(--margin) auto 0 auto;
	padding: 8px 16px;
	border-radius: 32px;
}

.postForm {
	border-radius: var(--radius);
}

.tl {
	background: var(--bg);
	border-radius: var(--radius);
	overflow: clip;
}
</style>
