<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component :is="prefer.s.enablePullToRefresh ? MkPullToRefresh : 'div'" :refresher="() => reloadTimeline()">
	<MkLoading v-if="paginator.fetching.value"/>

	<MkError v-else-if="paginator.error.value" @retry="paginator.init()"/>

	<div v-else-if="paginator.items.value.length === 0" key="_empty_">
		<div v-if="props.src === 'recommended' && recommendedRefreshAvailable" :class="$style.new">
			<div :class="$style.newBg1"></div>
			<div :class="$style.newBg2"></div>
			<button class="_button" :class="$style.newButton" @click="reloadTimeline()"><i class="ti ti-sparkles"></i> {{ recommendedText.newAvailable }}</button>
		</div>
		<slot name="empty"><MkResult type="empty" :text="i18n.ts.noNotes"/></slot>
	</div>

	<div v-else ref="rootEl">
		<div v-if="props.src === 'recommended' && recommendedRefreshAvailable" :class="$style.new">
			<div :class="$style.newBg1"></div>
			<div :class="$style.newBg2"></div>
			<button class="_button" :class="$style.newButton" @click="reloadTimeline()"><i class="ti ti-sparkles"></i> {{ recommendedText.newAvailable }}</button>
		</div>
		<div v-if="paginator.queuedAheadItemsCount.value > 0" :class="$style.new">
			<div :class="$style.newBg1"></div>
			<div :class="$style.newBg2"></div>
			<button class="_button" :class="$style.newButton" @click="releaseQueue()"><i class="ti ti-circle-arrow-up"></i> {{ i18n.ts.newNote }}</button>
		</div>
		<component
			:is="prefer.s.animation ? TransitionGroup : 'div'"
			:class="$style.notes"
			:enterActiveClass="$style.transition_x_enterActive"
			:leaveActiveClass="$style.transition_x_leaveActive"
			:enterFromClass="$style.transition_x_enterFrom"
			:leaveToClass="$style.transition_x_leaveTo"
			:moveClass="$style.transition_x_move"
			tag="div"
		>
			<template v-for="(note, i) in paginator.items.value" :key="note.id">
				<div v-if="props.src !== 'recommended' && i > 0 && isSeparatorNeeded(paginator.items.value[i -1].createdAt, note.createdAt)" :data-scroll-anchor="note.id">
					<div :class="$style.date">
						<span><i class="ti ti-chevron-up"></i> {{ getSeparatorInfo(paginator.items.value[i -1].createdAt, note.createdAt)?.prevText }}</span>
						<span style="height: 1em; width: 1px; background: var(--MI_THEME-divider);"></span>
						<span>{{ getSeparatorInfo(paginator.items.value[i -1].createdAt, note.createdAt)?.nextText }} <i class="ti ti-chevron-down"></i></span>
					</div>
					<MkNote :class="$style.note" :note="note" :withHardMute="true"/>
				</div>
				<div v-else-if="note._shouldInsertAd_" :data-scroll-anchor="note.id">
					<MkNote :class="$style.note" :note="note" :withHardMute="true"/>
					<div :class="$style.ad">
						<MkAd :preferForms="['horizontal', 'horizontal-big']"/>
					</div>
				</div>
				<MkNote v-else :class="$style.note" :note="note" :withHardMute="true" :data-scroll-anchor="note.id"/>
			</template>
		</component>
		<button v-show="paginator.canFetchOlder.value" key="_more_" v-appear="prefer.s.enableInfiniteScroll ? paginator.fetchOlder : null" :disabled="paginator.fetchingOlder.value" class="_button" :class="$style.more" @click="paginator.fetchOlder">
			<div v-if="!paginator.fetchingOlder.value">{{ i18n.ts.loadMore }}</div>
			<MkLoading v-else :inline="true"/>
		</button>
	</div>
</component>
</template>

<script lang="ts" setup>
import { computed, watch, onUnmounted, provide, useTemplateRef, TransitionGroup, onMounted, shallowRef, ref, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@@/js/use-interval.js';
import { useDocumentVisibility } from '@@/js/use-document-visibility.js';
import { getScrollContainer, scrollToTop } from '@@/js/scroll.js';
import type { BasicTimelineType } from '@/timelines.js';
import type { SoundStore } from '@/preferences/def.js';
import type { IPaginator, MisskeyEntity } from '@/utility/paginator.js';
import MkPullToRefresh from '@/components/MkPullToRefresh.vue';
import { useStream } from '@/stream.js';
import * as sound from '@/utility/sound.js';
import { $i } from '@/i.js';
import { instance } from '@/instance.js';
import { prefer } from '@/preferences.js';
import { store } from '@/store.js';
import MkNote from '@/components/MkNote.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { DI } from '@/di.js';
import { globalEvents, useGlobalEvent } from '@/events.js';
import { isSeparatorNeeded, getSeparatorInfo } from '@/utility/timeline-date-separate.js';
import { Paginator } from '@/utility/paginator.js';

const recommendedTexts: Record<string, { newAvailable: string }> = {
	'en-US': { newAvailable: 'New recommendations are available' },
	'ja-JP': { newAvailable: '新しいおすすめがあります' },
	'ja-KS': { newAvailable: '新しいおすすめがあるで' },
	'ko-KR': { newAvailable: '새로운 추천이 있습니다' },
	'zh-CN': { newAvailable: '有新的推荐内容' },
	'zh-TW': { newAvailable: '有新的推薦內容' },
};
const recommendedText = recommendedTexts[window.document.documentElement.lang] ?? recommendedTexts['en-US']!;

const props = withDefaults(defineProps<{
	src: BasicTimelineType | 'mentions' | 'directs' | 'list' | 'antenna' | 'channel' | 'role';
	list?: string;
	antenna?: string;
	channel?: string;
	role?: string;
	sound?: boolean;
	customSound?: SoundStore | null;
	withRenotes?: boolean;
	withReplies?: boolean;
	withSensitive?: boolean;
	onlyFiles?: boolean;
}>(), {
	withRenotes: true,
	withReplies: false,
	withSensitive: true,
	onlyFiles: false,
	sound: false,
	customSound: null,
});

provide('inTimeline', true);
provide('tl_withSensitive', computed(() => props.withSensitive));
provide(DI.inChannel, computed(() => props.src === 'channel' ? props.channel ?? null : null));

let paginator: IPaginator<Misskey.entities.Note>;
let skipRecommendedParameterReload = false;
let timelineReloadPromise: Promise<void> | null = null;
const initialRecommendedSnapshotId = props.src === 'recommended'
	? `${Date.now()}-${Math.random().toString(36).slice(2)}`
	: '';
const recommendedSnapshotId = ref(initialRecommendedSnapshotId);
// Sent only when an explicit refresh replaces a usable recommendation view.
// The server can reuse it during the short midnight protection window instead
// of doing another expensive ranking pass.
const previousRecommendedSnapshotId = ref<string | null>(null);
const recommendedRefreshAvailable = ref(false);

if (props.src === 'antenna') {
	paginator = markRaw(new Paginator('antennas/notes', {
		computedParams: computed(() => ({
			antennaId: props.antenna!,
		})),
		useShallowRef: true,
	}));
} else if (props.src === 'home') {
	paginator = markRaw(new Paginator('notes/timeline', {
		computedParams: computed(() => ({
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
		})),
		useShallowRef: true,
	}));
} else if (props.src === 'mutual') {
	paginator = markRaw(new Paginator('notes/timeline', {
		computedParams: computed(() => ({
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
			mutualOnly: true,
		}) as unknown as Misskey.Endpoints['notes/timeline']['req']),
		useShallowRef: true,
	}));
} else if (props.src === 'recommended') {
	paginator = markRaw(new Paginator('notes/recommended-timeline', {
		computedParams: computed(() => ({
			snapshotId: recommendedSnapshotId.value,
			previousSnapshotId: previousRecommendedSnapshotId.value ?? undefined,
			includeFollowing: true,
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
			withSensitive: props.withSensitive,
		})),
		// The recommendation snapshot is score-ordered, not ID-ordered. Its next
		// page must start after the last displayed snapshot entry.
		getOlderId: () => paginator.items.value.at(-1)?.id,
		useShallowRef: true,
	}));
} else if (props.src === 'local') {
	paginator = markRaw(new Paginator('notes/local-timeline', {
		computedParams: computed(() => ({
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: props.onlyFiles ? true : undefined,
		})),
		useShallowRef: true,
	}));
} else if (props.src === 'social') {
	paginator = markRaw(new Paginator('notes/hybrid-timeline', {
		computedParams: computed(() => ({
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: props.onlyFiles ? true : undefined,
		})),
		useShallowRef: true,
	}));
} else if (props.src === 'global') {
	paginator = markRaw(new Paginator('notes/global-timeline', {
		computedParams: computed(() => ({
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
		})),
		useShallowRef: true,
	}));
} else if (props.src === 'mentions') {
	paginator = markRaw(new Paginator('notes/mentions', {
		useShallowRef: true,
	}));
} else if (props.src === 'directs') {
	paginator = markRaw(new Paginator('notes/mentions', {
		params: {
			visibility: 'specified',
		},
		useShallowRef: true,
	}));
} else if (props.src === 'list') {
	paginator = markRaw(new Paginator('notes/user-list-timeline', {
		computedParams: computed(() => ({
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
			listId: props.list!,
		})),
		useShallowRef: true,
	}));
} else if (props.src === 'channel') {
	paginator = markRaw(new Paginator('channels/timeline', {
		computedParams: computed(() => ({
			channelId: props.channel!,
		})),
		useShallowRef: true,
	}));
} else if (props.src === 'role') {
	paginator = markRaw(new Paginator('roles/notes', {
		computedParams: computed(() => ({
			roleId: props.role!,
		})),
		useShallowRef: true,
	}));
} else {
	throw new Error('Unrecognized timeline type: ' + props.src);
}

onMounted(() => {
	paginator.init();

	if (paginator.computedParams) {
		watch(paginator.computedParams, () => {
			if (props.src === 'recommended' && skipRecommendedParameterReload) {
				skipRecommendedParameterReload = false;
				return;
			}
			paginator.reload();
		}, { immediate: false, deep: true });
	}
});

function isTop() {
	if (scrollContainer == null) return true;
	if (rootEl.value == null) return true;
	const scrollTop = scrollContainer.scrollTop;
	const tlTop = rootEl.value.offsetTop - scrollContainer.offsetTop;
	return scrollTop <= tlTop;
}

let scrollContainer: HTMLElement | null = null;

function onScrollContainerScroll() {
	if (isTop()) {
		paginator.releaseQueue();
	}
}

const rootEl = useTemplateRef('rootEl');
watch(rootEl, (el) => {
	if (el && scrollContainer == null) {
		scrollContainer = getScrollContainer(el);
		if (scrollContainer == null) return;
		scrollContainer.addEventListener('scroll', onScrollContainerScroll, { passive: true }); // ほんとはscrollendにしたいけどiosが非対応
	}
}, { immediate: true });

onUnmounted(() => {
	if (scrollContainer) {
		scrollContainer.removeEventListener('scroll', onScrollContainerScroll);
	}
});

const visibility = useDocumentVisibility();
let isPausingUpdate = false;

watch(visibility, () => {
	if (visibility.value === 'hidden') {
		isPausingUpdate = true;
	} else { // 'visible'
		isPausingUpdate = false;
		if (isTop()) {
			releaseQueue();
		}
	}
});

let adInsertionCounter = 0;

const MIN_POLLING_INTERVAL = 1000 * 10;
const POLLING_INTERVAL =
	prefer.s.pollingInterval === 1 ? MIN_POLLING_INTERVAL * 1.5 * 1.5 :
	prefer.s.pollingInterval === 2 ? MIN_POLLING_INTERVAL * 1.5 :
	prefer.s.pollingInterval === 3 ? MIN_POLLING_INTERVAL :
	MIN_POLLING_INTERVAL;

if (!store.s.realtimeMode && props.src !== 'recommended') {
	// TODO: 先頭のノートの作成日時が1日以上前であれば流速が遅いTLと見做してインターバルを通常より延ばす
	useInterval(async () => {
		paginator.fetchNewer({
			toQueue: !isTop() || isPausingUpdate,
		});
	}, POLLING_INTERVAL, {
		immediate: false,
		afterMounted: true,
	});

	useGlobalEvent('notePosted', (note) => {
		paginator.fetchNewer({
			toQueue: !isTop() || isPausingUpdate,
		});
	});
}

if (props.src === 'recommended') {
	// Recommendation candidates are discovered on demand. Showing the refresh
	// affordance on a fixed interval avoids a separate server-side check every
	// minute; no ranking occurs until the reader explicitly presses the button.
	useInterval(() => {
		recommendedRefreshAvailable.value = true;
	}, 60_000, {
		immediate: false,
		afterMounted: true,
	});
}

useGlobalEvent('noteDeleted', (noteId) => {
	paginator.removeItem(noteId);
});

useGlobalEvent('noteRemovedFromAntenna', (antennaId, noteId) => {
	if (props.src === 'antenna' && props.antenna === antennaId) {
		paginator.removeItem(noteId);
	}
});

function releaseQueue() {
	paginator.releaseQueue();
	scrollToTop(rootEl.value!);
}

function prepend(note: Misskey.entities.Note & MisskeyEntity) {
	adInsertionCounter++;

	if (instance.notesPerOneAd > 0 && adInsertionCounter % instance.notesPerOneAd === 0) {
		note._shouldInsertAd_ = true;
	}

	if (isTop() && !isPausingUpdate) {
		paginator.prepend(note);
	} else {
		paginator.enqueue(note);
	}

	if (props.sound) {
		if (props.customSound) {
			sound.playMisskeySfxFile(props.customSound);
		} else {
			sound.playMisskeySfx($i && (note.userId === $i.id) ? 'noteMy' : 'note');
		}
	}
}

const stream = store.s.realtimeMode ? useStream() : null;

const connections = {
	antenna: null as Misskey.IChannelConnection<Misskey.Channels['antenna']> | null,
	homeTimeline: null as Misskey.IChannelConnection<Misskey.Channels['homeTimeline']> | null,
	mutualTimeline: null as Misskey.IChannelConnection<Misskey.Channels['homeTimeline']> | null,
	localTimeline: null as Misskey.IChannelConnection<Misskey.Channels['localTimeline']> | null,
	hybridTimeline: null as Misskey.IChannelConnection<Misskey.Channels['hybridTimeline']> | null,
	globalTimeline: null as Misskey.IChannelConnection<Misskey.Channels['globalTimeline']> | null,
	main: null as Misskey.IChannelConnection<Misskey.Channels['main']> | null,
	userList: null as Misskey.IChannelConnection<Misskey.Channels['userList']> | null,
	channel: null as Misskey.IChannelConnection<Misskey.Channels['channel']> | null,
	roleTimeline: null as Misskey.IChannelConnection<Misskey.Channels['roleTimeline']> | null,
};

function connectChannel() {
	if (stream == null) return;
	if (props.src === 'antenna') {
		if (props.antenna == null) return;
		connections.antenna = stream.useChannel('antenna', {
			antennaId: props.antenna,
		});
		connections.antenna.on('note', prepend);
	} else if (props.src === 'home') {
		connections.homeTimeline = stream.useChannel('homeTimeline', {
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
		});
		connections.main = stream.useChannel('main');
		connections.homeTimeline.on('note', prepend);
	} else if (props.src === 'mutual') {
		connections.mutualTimeline = stream.useChannel('homeTimeline', {
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
			mutualOnly: true,
		} as unknown as Misskey.Channels['homeTimeline']['params']);
		connections.mutualTimeline.on('note', prepend);
	} else if (props.src === 'local') {
		connections.localTimeline = stream.useChannel('localTimeline', {
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: props.onlyFiles ? true : undefined,
		});
		connections.localTimeline.on('note', prepend);
	} else if (props.src === 'social') {
		connections.hybridTimeline = stream.useChannel('hybridTimeline', {
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: props.onlyFiles ? true : undefined,
		});
		connections.hybridTimeline.on('note', prepend);
	} else if (props.src === 'global') {
		connections.globalTimeline = stream.useChannel('globalTimeline', {
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
		});
		connections.globalTimeline.on('note', prepend);
	} else if (props.src === 'mentions') {
		connections.main = stream.useChannel('main');
		connections.main.on('mention', prepend);
	} else if (props.src === 'directs') {
		connections.main = stream.useChannel('main');
		connections.main.on('mention', note => {
			if (note.visibility === 'specified') {
				prepend(note);
			}
		});
	} else if (props.src === 'list') {
		if (props.list == null) return;
		connections.userList = stream.useChannel('userList', {
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
			listId: props.list,
		});
		connections.userList.on('note', prepend);
	} else if (props.src === 'channel') {
		if (props.channel == null) return;
		connections.channel = stream.useChannel('channel', {
			channelId: props.channel,
		});
		connections.channel.on('note', prepend);
	} else if (props.src === 'role') {
		if (props.role == null) return;
		connections.roleTimeline = stream.useChannel('roleTimeline', {
			roleId: props.role,
		});
		connections.roleTimeline.on('note', prepend);
	}
}

function disconnectChannel() {
	for (const key in connections) {
		const conn = connections[key as keyof typeof connections];
		if (conn != null) {
			conn.dispose();
			connections[key as keyof typeof connections] = null;
		}
	}
}

if (store.s.realtimeMode) {
	connectChannel();
}

watch(() => [props.list, props.antenna, props.channel, props.role, props.withRenotes], () => {
	if (store.s.realtimeMode) {
		disconnectChannel();
		connectChannel();
	}
	// Renote inclusion changes which candidates are eligible, rather than only
	// how an already-packed note is rendered. Give it a fresh fixed snapshot.
	if (props.src === 'recommended') void reloadTimeline();
});
watch(() => props.withSensitive, () => paginator.reload());

onUnmounted(() => {
	disconnectChannel();
});

function reloadTimeline() {
	if (timelineReloadPromise != null) return timelineReloadPromise;
	timelineReloadPromise = (async () => {
		adInsertionCounter = 0;
		if (props.src === 'recommended') {
			// Changing the snapshot parameters would normally trigger the generic
			// computed-parameter watcher. This explicit reload is the one request
			// that must own the transition, otherwise two responses append the same
			// notes to the paginator.
			skipRecommendedParameterReload = true;
			previousRecommendedSnapshotId.value = recommendedSnapshotId.value;
			recommendedSnapshotId.value = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
			recommendedRefreshAvailable.value = false;
		}

		await paginator.reload();
	})().finally(() => {
		timelineReloadPromise = null;
	});
	return timelineReloadPromise;
}

defineExpose({
	reloadTimeline,
});
</script>

<style lang="scss" module>
.transition_x_move {
	transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1);
}

.transition_x_enterActive {
	transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1);

	&.note,
	.note {
		/* Skip Note Rendering有効時、TransitionGroupでnoteを追加するときに一瞬がくっとなる問題を抑制する */
		content-visibility: visible !important;
	}
}

.transition_x_leaveActive {
	transition: height 0.2s cubic-bezier(0,.5,.5,1), opacity 0.2s cubic-bezier(0,.5,.5,1);
}

.transition_x_enterFrom {
	opacity: 0;
	transform: translateY(max(-64px, -100%));
}

@supports (interpolate-size: allow-keywords) {
	.transition_x_leaveTo {
		interpolate-size: allow-keywords; // heightのtransitionを動作させるために必要
		height: 0;
	}
}

.transition_x_leaveTo {
	opacity: 0;
}

.notes {
	container-type: inline-size;
	background: var(--MI_THEME-panel);
}

.note:not(:empty) {
	border-bottom: solid 0.5px var(--MI_THEME-divider);
}

.new {
	--gapFill: 0.5px; // 上位ヘッダーの高さにフォントの関係などで少数が含まれると、レンダリングエンジンによっては隙間が表示されてしまうため、隙間を隠すために少しずらす

	position: sticky;
	top: calc(var(--MI-stickyTop, 0px) - var(--gapFill));
	z-index: 1000;
	width: 100%;
	box-sizing: border-box;
	padding: calc(10px + var(--gapFill)) 0 10px 0;
}

/* 疑似progressive blur */
.newBg1, .newBg2 {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
}

.newBg1 {
	height: 100%;
	-webkit-backdrop-filter: var(--MI-blur, blur(2px));
	backdrop-filter: var(--MI-blur, blur(2px));
	mask-image: linear-gradient( /* 疑似Easing Linear Gradients */
		to top,
		rgb(0 0 0 / 0%) 0%,
		rgb(0 0 0 / 4.9%) 7.75%,
		rgb(0 0 0 / 10.4%) 11.25%,
		rgb(0 0 0 / 45%) 23.55%,
		rgb(0 0 0 / 55%) 26.45%,
		rgb(0 0 0 / 89.6%) 38.75%,
		rgb(0 0 0 / 95.1%) 42.25%,
		rgb(0 0 0 / 100%) 50%
	);
}

.newBg2 {
	height: 75%;
	-webkit-backdrop-filter: var(--MI-blur, blur(4px));
	backdrop-filter: var(--MI-blur, blur(4px));
	mask-image: linear-gradient( /* 疑似Easing Linear Gradients */
		to top,
		rgb(0 0 0 / 0%) 0%,
		rgb(0 0 0 / 4.9%) 15.5%,
		rgb(0 0 0 / 10.4%) 22.5%,
		rgb(0 0 0 / 45%) 47.1%,
		rgb(0 0 0 / 55%) 52.9%,
		rgb(0 0 0 / 89.6%) 77.5%,
		rgb(0 0 0 / 95.1%) 91.9%,
		rgb(0 0 0 / 100%) 100%
	);
}

.newButton {
	position: relative;
	display: block;
	padding: 6px 12px;
	border-radius: 999px;
	width: max-content;
	margin: auto;
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-fgOnAccent);
	font-size: 90%;

	&:hover {
		background: hsl(from var(--MI_THEME-accent) h s calc(l + 5));
	}

	&:active {
		background: hsl(from var(--MI_THEME-accent) h s calc(l - 5));
	}
}

.date {
	display: flex;
	font-size: 85%;
	align-items: center;
	justify-content: center;
	gap: 1em;
	padding: 8px 8px;
	margin: 0 auto;
	border-bottom: solid 0.5px var(--MI_THEME-divider);
}

.ad {
	padding: 8px;
	background-size: auto auto;
	background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, var(--MI_THEME-bg) 8px, var(--MI_THEME-bg) 14px);
	border-bottom: solid 0.5px var(--MI_THEME-divider);

	&:empty {
		display: none;
	}
}

.more {
	display: block;
	width: 100%;
	box-sizing: border-box;
	padding: 16px;
	background: var(--MI_THEME-panel);
}
</style>
