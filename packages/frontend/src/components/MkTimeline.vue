<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component :is="prefer.s.enablePullToRefresh ? MkPullToRefresh : 'div'" :refresher="() => reloadTimeline()">
	<MkPostForm
		v-if="postForm"
		class="post-form"
		:isInYamiTimeline="src === 'yami'"
		@posted="emit('posted')"
	/>
	<MkPagination v-if="paginationQuery" ref="pagingComponent" :pagination="paginationQuery" @queue="emit('queue', $event)">
		<template #empty><MkResult type="empty" :text="i18n.ts.noNotes"/></template>

		<template #default="{ items: notes }">
			<component
				:is="prefer.s.animation ? TransitionGroup : 'div'"
				ref="tlComponent"
				:class="[$style.root, { [$style.noGap]: noGap, '_gaps': !noGap, [$style.reverse]: paginationQuery.reversed }]"
				:enterActiveClass="$style.transition_x_enterActive"
				:leaveActiveClass="$style.transition_x_leaveActive"
				:enterFromClass="$style.transition_x_enterFrom"
				:leaveToClass="$style.transition_x_leaveTo"
				:moveClass="$style.transition_x_move"
				tag="div"
			>
				<template v-for="(note, i) in notes" :key="note.id">
					<div v-if="note._shouldInsertAd_" :class="[$style.noteWithAd, { '_gaps': !noGap }]" :data-scroll-anchor="note.id">
						<MkNote :class="$style.note" :note="note" :withHardMute="true"/>
						<div :class="$style.ad">
							<MkAd :preferForms="['horizontal', 'horizontal-big']"/>
						</div>
					</div>
					<MkNote v-else :class="$style.note" :note="note" :withHardMute="true" :data-scroll-anchor="note.id"/>
				</template>
			</component>
		</template>
	</MkPagination>
</component>
</template>

<script lang="ts" setup>
import { computed, watch, provide, onUnmounted, useTemplateRef, TransitionGroup } from 'vue';
import * as Misskey from 'misskey-js';
import type { BasicTimelineType } from '@/timelines.js';
import type { Paging } from '@/components/MkPagination.vue';
import MkPullToRefresh from '@/components/MkPullToRefresh.vue';
import { useStream } from '@/stream.js';
import * as sound from '@/utility/sound.js';
import { $i } from '@/i.js';
import { instance } from '@/instance.js';
import { prefer } from '@/preferences.js';
import MkNote from '@/components/MkNote.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkPostForm from '@/components/MkPostForm.vue';
import MkResult from '@/components/global/MkResult.vue';
import { i18n } from '@/i18n.js';

// フォークシステムでは withFiles を使用（本家は onlyFiles）
const props = withDefaults(defineProps<{
	src: BasicTimelineType | 'mentions' | 'directs' | 'list' | 'antenna' | 'channel' | 'role';
	list?: string;
	antenna?: string;
	channel?: string;
	role?: string;
	sound?: boolean;
	withRenotes?: boolean;
	withReplies?: boolean;
	withHashtags?: boolean;
	withSensitive?: boolean;
	withFiles?: boolean;
	localOnly?: boolean;
	remoteOnly?: boolean;
	showYamiNonFollowingPublicNotes?: boolean;
	showYamiFollowingNotes?: boolean;
	postForm?: boolean;
}>(), {
	withRenotes: true,
	withReplies: false,
	withHashtags: true,
	withSensitive: true,
	withFiles: false,
	localOnly: false,
	remoteOnly: false,
	showYamiNonFollowingPublicNotes: false,
	showYamiFollowingNotes: true,
	postForm: false,
});

const emit = defineEmits<{
	(ev: 'note'): void;
	(ev: 'queue', count: number): void;
	(ev: 'posted'): void;
}>();

provide('inTimeline', true);
provide('tl_withSensitive', computed(() => props.withSensitive));
provide('inChannel', computed(() => props.src === 'channel'));

type TimelineQueryType = {
	antennaId?: string,
	withRenotes?: boolean,
	withReplies?: boolean,
	withFiles?: boolean,
	visibility?: string,
	listId?: string,
	channelId?: string,
	roleId?: string,
	localOnly?: boolean,
	remoteOnly?: boolean,
	withHashtags?: boolean,
	showYamiNonFollowingPublicNotes?: boolean,
	showYamiFollowingNotes?: boolean,
};

const pagingComponent = useTemplateRef('pagingComponent');

let tlNotesCount = 0;

function prepend(note) {
	if (pagingComponent.value == null) return;

	tlNotesCount++;

	if (instance.notesPerOneAd > 0 && tlNotesCount % instance.notesPerOneAd === 0) {
		note._shouldInsertAd_ = true;
	}

	pagingComponent.value.prepend(note);

	emit('note');

	if (props.sound) {
		sound.playMisskeySfx($i && (note.userId === $i.id) ? 'noteMy' : 'note');
	}
}

// TypeScriptエラーを解消するための型定義
let connection: Misskey.ChannelConnection | null = null;
let connection2: Misskey.ChannelConnection | null = null;
let paginationQuery: Paging | null = null;
const noGap = !prefer.s.showGapBetweenNotesInTimeline;

const stream = useStream();

// 本家スタイルの接続管理関数
function disconnectChannel() {
	if (connection) connection.dispose();
	if (connection2) connection2.dispose();
}

function connectChannel() {
	disconnectChannel();

	if (props.src === 'antenna') {
		if (props.antenna == null) return;
		connection = stream.useChannel('antenna', {
			antennaId: props.antenna,
		});

		connection.on('note', prepend);
	} else if (props.src === 'home') {
		connection = stream.useChannel('homeTimeline', {
			withRenotes: props.withRenotes,
			withFiles: props.withFiles ? true : undefined,
		});

		connection.on('note', prepend);

		connection2 = stream.useChannel('main');
	} else if (props.src === 'yami') {
		// ヤミタイムライン（フォーク独自機能）
		connection = stream.useChannel('yamiTimeline', {
			withRenotes: props.withRenotes,
			withFiles: props.withFiles ? true : undefined,
			showYamiNonFollowingPublicNotes: props.showYamiNonFollowingPublicNotes,
			showYamiFollowingNotes: props.showYamiFollowingNotes,
		});

		connection.on('note', prepend);

		connection2 = stream.useChannel('main');
	} else if (props.src === 'local') {
		connection = stream.useChannel('localTimeline', {
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: props.withFiles ? true : undefined,
		});

		connection.on('note', prepend);
	} else if (props.src === 'social') {
		connection = stream.useChannel('hybridTimeline', {
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: props.withFiles ? true : undefined,
			localOnly: props.localOnly,
		});

		connection.on('note', prepend);
	} else if (props.src === 'global') {
		connection = stream.useChannel('globalTimeline', {
			withRenotes: props.withRenotes,
			withFiles: props.withFiles ? true : undefined,
			remoteOnly: props.remoteOnly,
			withHashtags: props.withHashtags,
		});

		connection.on('note', prepend);
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
			withFiles: props.withFiles ? true : undefined,
			listId: props.list,
		});

		connection.on('note', prepend);
	} else if (props.src === 'channel') {
		if (props.channel == null) return;
		connection = stream.useChannel('channel', {
			channelId: props.channel,
		});

		connection.on('note', prepend);
	} else if (props.src === 'role') {
		if (props.role == null) return;
		connection = stream.useChannel('roleTimeline', {
			roleId: props.role,
		});

		connection.on('note', prepend);
	}
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
			withFiles: props.withFiles ? true : undefined,
		};
	} else if (props.src === 'yami') {
		endpoint = 'notes/yami-timeline';
		query = {
			withRenotes: props.withRenotes,
			withFiles: props.withFiles ? true : undefined,
			showYamiNonFollowingPublicNotes: props.showYamiNonFollowingPublicNotes,
			showYamiFollowingNotes: props.showYamiFollowingNotes,
		};
	} else if (props.src === 'local') {
		endpoint = 'notes/local-timeline';
		query = {
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: props.withFiles ? true : undefined,
		};
	} else if (props.src === 'social') {
		endpoint = 'notes/hybrid-timeline';
		query = {
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: props.withFiles ? true : undefined,
			localOnly: props.localOnly,
		};
	} else if (props.src === 'global') {
		endpoint = 'notes/global-timeline';
		query = {
			withRenotes: props.withRenotes,
			withFiles: props.withFiles ? true : undefined,
			remoteOnly: props.remoteOnly,
			withHashtags: props.withHashtags,
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
			withFiles: props.withFiles ? true : undefined,
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
		endpoint = null;
		query = null;
	}

	if (endpoint && query) {
		paginationQuery = {
			endpoint: endpoint,
			limit: 10,
			params: query,
		};
	} else {
		paginationQuery = null;
	}
}

function refreshEndpointAndChannel() {
	if (!prefer.s.disableStreamingTimeline) {
		disconnectChannel();
		connectChannel();
	}

	updatePaginationQuery();
}

// コンポーネント破棄時にイベントリスナーを解除
onUnmounted(() => {
	disconnectChannel();
});

// デッキのリストカラムでwithRenotesを変更した場合に自動的に更新されるようにさせる
// IDが切り替わったら切り替え先のTLを表示させたい
watch(() => [props.list, props.antenna, props.channel, props.role, props.withRenotes], refreshEndpointAndChannel);

// withSensitiveはクライアントで完結する処理のため、単にリロードするだけでOK
watch(() => props.withSensitive, reloadTimeline);

// ローカル/リモート/やみフィルターの変更を監視（フォーク独自機能）
watch(
	() => [props.localOnly, props.remoteOnly, props.showYamiNonFollowingPublicNotes, props.showYamiFollowingNotes],
	async () => {
		await refreshEndpointAndChannel();
	},
	{ immediate: false },
);

// 初回表示用
refreshEndpointAndChannel();

function reloadTimeline() {
	return new Promise<void>((res) => {
		if (pagingComponent.value == null) return;

		tlNotesCount = 0;

		pagingComponent.value.reload().then(() => {
			res();
		});
	});
}

// timeline.vueから呼び出されるメソッド
function timetravel(date: Date) {
	if (pagingComponent.value) {
		pagingComponent.value.timetravel(date);
	}
}

function focus() {
	if (pagingComponent.value) {
		pagingComponent.value.focus();
	}
}

// timeline.vueから呼び出せるよう公開
defineExpose({
	reloadTimeline,
	timetravel,
	focus,
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

.reverse {
	display: flex;
	flex-direction: column-reverse;
}

.root {
	container-type: inline-size;

	&.noGap {
		background: var(--MI_THEME-panel);

		.note {
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

.ad:empty {
	display: none;
}
</style>
