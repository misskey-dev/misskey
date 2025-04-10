<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPullToRefresh ref="prComponent" :refresher="() => reloadTimeline()">
	<MkNotes
		v-if="paginationQuery"
		ref="tlComponent"
		:pagination="paginationQuery"
		:noGap="!prefer.s.showGapBetweenNotesInTimeline"
		@queue="emit('queue', $event)"
		@status="prComponent?.setDisabled($event)"
	/>
</MkPullToRefresh>
</template>

<script lang="ts" setup>
import { computed, watch, provide, onUnmounted, ref, markRaw, Ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import type { BasicTimelineType } from '@/timelines.js';
import MkNotes from '@/components/MkNotes.vue';
import MkPullToRefresh from '@/components/MkPullToRefresh.vue';
import { useStream } from '@/stream.js';
import * as sound from '@/utility/sound.js';
import { $i } from '@/i.js';
import { instance } from '@/instance.js';
import { prefer } from '@/preferences.js';

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
}>(), {
	withRenotes: true,
	withReplies: false,
	withHashtags: true,
	withSensitive: true,
	withFiles: false,
	localOnly: false,
	remoteOnly: false,
});

const emit = defineEmits<{
	(ev: 'note'): void;
	(ev: 'queue', count: number): void;
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
};

const prComponent = useTemplateRef('prComponent');
const tlComponent = useTemplateRef('tlComponent');

// ページネーションクエリを保持する参照
const paginationQuery = ref<{
	endpoint: string;
	limit: number;
	params: TimelineQueryType;
} | null>(null);

let tlNotesCount = 0;
const stream = useStream();

// 現在のチャネル接続を保持する参照
const channelConnection = markRaw({
	dispose: null,
});

function prepend(note) {
	if (tlComponent.value == null) return;

	tlNotesCount++;

	if (instance.notesPerOneAd > 0 && tlNotesCount % instance.notesPerOneAd === 0) {
		note._shouldInsertAd_ = true;
	}

	tlComponent.value.pagingComponent?.prepend(note);

	emit('note');

	if (props.sound) {
		sound.playMisskeySfx($i && (note.userId === $i.id) ? 'noteMy' : 'note');
	}
}

function disconnectChannel() {
	if (channelConnection.dispose) {
		channelConnection.dispose();
		channelConnection.dispose = null;
	}
}

function connectChannel() {
	disconnectChannel();

	let connection;

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

		// メインチャンネルも監視
		const mainConnection = stream.useChannel('main');

		// 複数のconnectionを管理できるように修正
		const originalDispose = connection.dispose;
		connection.dispose = () => {
			originalDispose();
			mainConnection.dispose();
		};
	} else if (props.src === 'yami') {
		connection = stream.useChannel('yamiTimeline', {
			withRenotes: props.withRenotes,
			withFiles: props.withFiles ? true : undefined,
		});

		connection.on('note', prepend);

		// メインチャンネルも監視
		const mainConnection = stream.useChannel('main');

		// 複数のconnectionを管理できるように修正
		const originalDispose = connection.dispose;
		connection.dispose = () => {
			originalDispose();
			mainConnection.dispose();
		};
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

	if (connection) {
		channelConnection.dispose = () => connection.dispose();
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
		paginationQuery.value = {
			endpoint: endpoint,
			limit: 10,
			params: query,
		};
	} else {
		paginationQuery.value = null;
	}
}

function refreshEndpointAndChannel() {
	if (!prefer.s.disableStreamingTimeline) {
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

// ローカル/リモートフィルターの変更を監視
watch(
	() => [props.localOnly, props.remoteOnly],
	async () => {
		await refreshEndpointAndChannel();
	},
	{ immediate: false },
);

// 初回表示用
refreshEndpointAndChannel();

onUnmounted(() => {
	disconnectChannel();
});

function reloadTimeline() {
	return new Promise<void>((res) => {
		if (tlComponent.value == null) return;

		tlNotesCount = 0;

		tlComponent.value.pagingComponent?.reload().then(() => {
			res();
		});
	});
}

defineExpose({
	reloadTimeline,
});
</script>

<style lang="scss" module>
.mk-timeline {
  background: var(--bg);
  border-radius: var(--radius);
}
</style>
