<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPullToRefresh :refresher="() => reloadTimeline()">
	<MkLoading v-if="paginator.fetching.value"/>

	<MkError v-else-if="paginator.error.value" @retry="paginator.init()"/>

	<div v-else-if="paginator.items.value.length === 0" key="_empty_">
		<slot name="empty">
			<div class="_fullinfo">
				<img :src="infoImageUrl" draggable="false"/>
				<div>{{ i18n.ts.noNotes }}</div>
			</div>
		</slot>
	</div>

	<div v-else ref="rootEl">
		<div v-if="paginator.queue.value.length > 0" :class="$style.new" @click="releaseQueue()"><button class="_button" :class="$style.newButton">{{ i18n.ts.newNoteRecived }}</button></div>
		<component
			:is="prefer.s.animation ? TransitionGroup : 'div'"
			:class="[$style.notes, { [$style.noGap]: noGap, '_gaps': !noGap }]"
			:enterActiveClass="$style.transition_x_enterActive"
			:leaveActiveClass="$style.transition_x_leaveActive"
			:enterFromClass="$style.transition_x_enterFrom"
			:leaveToClass="$style.transition_x_leaveTo"
			:moveClass=" $style.transition_x_move"
			tag="div"
		>
			<template v-for="(note, i) in paginator.items.value" :key="note.id">
				<div v-if="note._shouldInsertAd_" :class="[$style.noteWithAd, { '_gaps': !noGap }]" :data-scroll-anchor="note.id">
					<MkNote :class="$style.note" :note="note" :withHardMute="true"/>
					<div :class="$style.ad">
						<MkAd :preferForms="['horizontal', 'horizontal-big']"/>
					</div>
				</div>
				<MkNote v-else :class="$style.note" :note="note" :withHardMute="true" :data-scroll-anchor="note.id"/>
			</template>
		</component>
		<button v-show="paginator.canFetchMore.value" key="_more_" v-appear="prefer.s.enableInfiniteScroll ? paginator.fetchOlder : null" :disabled="paginator.moreFetching.value" class="_button" :class="$style.more" @click="paginator.fetchOlder">
			<div v-if="!paginator.moreFetching.value">{{ i18n.ts.loadMore }}</div>
			<MkLoading v-else/>
		</button>
	</div>
</MkPullToRefresh>
</template>

<script lang="ts" setup>
import { computed, watch, onUnmounted, provide, useTemplateRef, TransitionGroup, onMounted, shallowRef, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@@/js/use-interval.js';
import { isHeadVisible, scrollToTop } from '@@/js/scroll.js';
import type { BasicTimelineType } from '@/timelines.js';
import type { PagingCtx } from '@/use/use-pagination.js';
import { usePagination } from '@/use/use-pagination.js';
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
import { infoImageUrl } from '@/instance.js';
import { globalEvents } from '@/events.js';

const props = withDefaults(defineProps<{
	src: BasicTimelineType | 'mentions' | 'directs' | 'list' | 'antenna' | 'channel' | 'role';
	list?: string;
	antenna?: string;
	channel?: string;
	role?: string;
	sound?: boolean;
	withRenotes?: boolean;
	withReplies?: boolean;
	withSensitive?: boolean;
	onlyFiles?: boolean;
}>(), {
	withRenotes: true,
	withReplies: false,
	withSensitive: true,
	onlyFiles: false,
});

const emit = defineEmits<{
}>();

provide('inTimeline', true);
provide('tl_withSensitive', computed(() => props.withSensitive));
provide('inChannel', computed(() => props.src === 'channel'));

const rootEl = useTemplateRef('rootEl');

type TimelineQueryType = {
	antennaId?: string,
	withRenotes?: boolean,
	withReplies?: boolean,
	withFiles?: boolean,
	visibility?: string,
	listId?: string,
	channelId?: string,
	roleId?: string
};

let adInsertionCounter = 0;

const POLLING_INTERVAL = 1000 * 15;

if (!store.s.realtimeMode) {
	useInterval(async () => {
		const isTop = rootEl.value == null ? false : isHeadVisible(rootEl.value, 16);
		paginator.fetchNewer({
			toQueue: !isTop,
		});
	}, POLLING_INTERVAL, {
		immediate: false,
		afterMounted: true,
	});
}

globalEvents.on('notePosted', (note: Misskey.entities.Note) => {
	const isTop = rootEl.value == null ? false : isHeadVisible(rootEl.value, 16);
	if (isTop) {
		paginator.fetchNewer({
			toQueue: false,
		});
	}
});

function releaseQueue() {
	paginator.releaseQueue();
	scrollToTop(rootEl.value);
}

function prepend(note: Misskey.entities.Note) {
	adInsertionCounter++;

	if (instance.notesPerOneAd > 0 && adInsertionCounter % instance.notesPerOneAd === 0) {
		note._shouldInsertAd_ = true;
	}

	const isTop = isHeadVisible(rootEl.value, 16);
	if (isTop) {
		paginator.prepend(note);
	} else {
		paginator.enqueue(note);
	}

	if (props.sound) {
		sound.playMisskeySfx($i && (note.userId === $i.id) ? 'noteMy' : 'note');
	}
}

let connection: Misskey.ChannelConnection | null = null;
let connection2: Misskey.ChannelConnection | null = null;
let paginationQuery: PagingCtx;
const noGap = !prefer.s.showGapBetweenNotesInTimeline;

const stream = store.s.realtimeMode ? useStream() : null;

function connectChannel() {
	if (props.src === 'antenna') {
		if (props.antenna == null) return;
		connection = stream.useChannel('antenna', {
			antennaId: props.antenna,
		});
	} else if (props.src === 'home') {
		connection = stream.useChannel('homeTimeline', {
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
		});
		connection2 = stream.useChannel('main');
	} else if (props.src === 'local') {
		connection = stream.useChannel('localTimeline', {
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: props.onlyFiles ? true : undefined,
		});
	} else if (props.src === 'social') {
		connection = stream.useChannel('hybridTimeline', {
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: props.onlyFiles ? true : undefined,
		});
	} else if (props.src === 'global') {
		connection = stream.useChannel('globalTimeline', {
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
		});
	} else if (props.src === 'mentions') {
		connection = stream.useChannel('main');
		connection.on('mention', prepend);
	} else if (props.src === 'directs') {
		const onNote = note => {
			if (note.visibility === 'specified') {
				prepend(note);
			}
		};
		connection = stream.useChannel('main');
		connection.on('mention', onNote);
	} else if (props.src === 'list') {
		if (props.list == null) return;
		connection = stream.useChannel('userList', {
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
			listId: props.list,
		});
	} else if (props.src === 'channel') {
		if (props.channel == null) return;
		connection = stream.useChannel('channel', {
			channelId: props.channel,
		});
	} else if (props.src === 'role') {
		if (props.role == null) return;
		connection = stream.useChannel('roleTimeline', {
			roleId: props.role,
		});
	}
	if (props.src !== 'directs' && props.src !== 'mentions') connection?.on('note', prepend);
}

function disconnectChannel() {
	if (connection) connection.dispose();
	if (connection2) connection2.dispose();
}

function updatePaginationQuery() {
	let endpoint: keyof Misskey.Endpoints | null;
	let query: TimelineQueryType | null;

	if (props.src === 'antenna') {
		endpoint = 'antennas/notes';
		query = {
			antennaId: props.antenna,
		};
	} else if (props.src === 'home') {
		endpoint = 'notes/timeline';
		query = {
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
		};
	} else if (props.src === 'local') {
		endpoint = 'notes/local-timeline';
		query = {
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: props.onlyFiles ? true : undefined,
		};
	} else if (props.src === 'social') {
		endpoint = 'notes/hybrid-timeline';
		query = {
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: props.onlyFiles ? true : undefined,
		};
	} else if (props.src === 'global') {
		endpoint = 'notes/global-timeline';
		query = {
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
		};
	} else if (props.src === 'mentions') {
		endpoint = 'notes/mentions';
		query = null;
	} else if (props.src === 'directs') {
		endpoint = 'notes/mentions';
		query = {
			visibility: 'specified',
		};
	} else if (props.src === 'list') {
		endpoint = 'notes/user-list-timeline';
		query = {
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
			listId: props.list,
		};
	} else if (props.src === 'channel') {
		endpoint = 'channels/timeline';
		query = {
			channelId: props.channel,
		};
	} else if (props.src === 'role') {
		endpoint = 'roles/notes';
		query = {
			roleId: props.role,
		};
	} else {
		throw new Error('Unrecognized timeline type: ' + props.src);
	}

	paginationQuery = {
		endpoint: endpoint,
		limit: 10,
		params: query,
	};
}

function refreshEndpointAndChannel() {
	if (store.s.realtimeMode) {
		disconnectChannel();
		connectChannel();
	}

	updatePaginationQuery();
}

// デッキのリストカラムでwithRenotesを変更した場合に自動的に更新されるようにさせる
// IDが切り替わったら切り替え先のTLを表示させたい
watch(() => [props.list, props.antenna, props.channel, props.role, props.withRenotes], refreshEndpointAndChannel);

// withSensitiveはクライアントで完結する処理のため、単にリロードするだけでOK
watch(() => props.withSensitive, reloadTimeline);

// 初回表示用
refreshEndpointAndChannel();

const paginator = usePagination({
	ctx: paginationQuery,
	useShallowRef: true,
});

onUnmounted(() => {
	disconnectChannel();
});

function reloadTimeline() {
	return new Promise<void>((res) => {
		adInsertionCounter = 0;

		paginator.reload().then(() => {
			res();
		});
	});
}

defineExpose({
	reloadTimeline,
});
</script>

<style lang="scss" module>
.transition_x_move,
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,.5,.5,1), transform 0.3s cubic-bezier(0,.5,.5,1) !important;
}
.transition_x_enterFrom,
.transition_x_leaveTo {
	opacity: 0;
	transform: translateY(-50%);
}
.transition_x_leaveActive {
	position: absolute;
}

.notes {
	container-type: inline-size;

	&.noGap {
		background: var(--MI_THEME-panel);

		.note:not(:last-child) {
			border-bottom: solid 0.5px var(--MI_THEME-divider);
		}

		.ad {
			padding: 8px;
			background-size: auto auto;
			background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, var(--MI_THEME-bg) 8px, var(--MI_THEME-bg) 14px);
			border-bottom: solid 0.5px var(--MI_THEME-divider);
		}
	}

	&:not(.noGap) {
		background: var(--MI_THEME-bg);

		.note {
			background: var(--MI_THEME-panel);
			border-radius: var(--MI-radius);
		}
	}
}

.new {
	position: sticky;
	top: var(--MI-stickyTop, 0px);
	z-index: 1000;
	width: 100%;
	box-sizing: border-box;
	padding: 8px 0;
	-webkit-backdrop-filter: var(--MI-blur, blur(4px));
	backdrop-filter: var(--MI-blur, blur(4px));
}

.newButton {
	display: block;
	padding: 8px 16px;
	border-radius: 999px;
	width: max-content;
	margin: auto;
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-fgOnAccent);
	font-size: 90%;
}

.ad:empty {
	display: none;
}

.more {
	display: block;
	width: 100%;
	box-sizing: border-box;
	padding: 16px;
	background: var(--MI_THEME-panel);
	border-top: solid 0.5px var(--MI_THEME-divider);
}
</style>
