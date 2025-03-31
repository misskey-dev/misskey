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
		:noGap="!defaultStore.state.showGapBetweenNotesInTimeline"
		@queue="emit('queue', $event)"
		@status="prComponent?.setDisabled($event)"
	/>
</MkPullToRefresh>
</template>

<script lang="ts" setup>
import { computed, watch, onUnmounted, provide, shallowRef, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import MkNotes from '@/components/MkNotes.vue';
import MkPullToRefresh from '@/components/MkPullToRefresh.vue';
import { useStream } from '@/stream.js';
import * as sound from '@/scripts/sound.js';
import { deepMerge } from '@/scripts/merge.js';
import { $i } from '@/account.js';
import { instance } from '@/instance.js';
import { defaultStore } from '@/store.js';
import { Paging } from '@/components/MkPagination.vue';
import { generateClientTransactionId } from '@/scripts/misskey-api.js';

const props = withDefaults(defineProps<{
	src: 'home' | 'local' | 'media' | 'social' | 'global' | 'mentions' | 'directs' | 'list' | 'antenna' | 'channel' | 'role';
	list?: string;
	antenna?: string;
	channel?: string;
	role?: string;
	sound?: boolean;
	withRenotes?: boolean;
	withReplies?: boolean;
	onlyFiles?: boolean;
}>(), {
	withRenotes: true,
	withReplies: false,
	onlyFiles: false,
});

const emit = defineEmits<{
	(ev: 'note'): void;
	(ev: 'queue', count: number): void;
}>();

provide('inTimeline', true);
provide('inChannel', computed(() => props.src === 'channel'));

type TimelineQueryType = {
  antennaId?: string,
  withRenotes?: boolean,
  withReplies?: boolean,
  withFiles?: boolean,
  visibility?: string,
  listId?: string,
  channelId?: string,
  roleId?: string
}

const prComponent = shallowRef<InstanceType<typeof MkPullToRefresh>>();
const tlComponent = shallowRef<InstanceType<typeof MkNotes>>();

let tlNotesCount = 0;
const notVisibleNoteData = new Array<object>();

async function fulfillNoteData(data) {
	// チェックするプロパティはなんでも良い
	// minimizeが有効でid以外が存在しない場合は取得する
	if (!data.visibility) {
		const res = await window.fetch(`/notes/${data.id}.json`, {
			method: 'GET',
			credentials: 'omit',
			headers: {
				'Authorization': 'anonymous',
				'X-Client-Transaction-Id': generateClientTransactionId('misskey'),
			},
		});
		if (!res.ok) return null;
		return deepMerge(data, await res.json());
	}

	return data;
}

async function prepend(data) {
	if (tlComponent.value == null) return;

	let note = data;

	if (!document.hidden) {
		note = await fulfillNoteData(data);
		if (note == null) return;

		tlNotesCount++;

		if (instance.notesPerOneAd > 0 && tlNotesCount % instance.notesPerOneAd === 0) {
			note._shouldInsertAd_ = true;
		}

		tlComponent.value.pagingComponent?.prepend(note);
	} else {
		notVisibleNoteData.push(data);

		if (notVisibleNoteData.length > 10) {
			notVisibleNoteData.shift();
		}
	}

	emit('note');

	if (props.sound) {
		sound.playMisskeySfx($i && (note.userId === $i.id) ? 'noteMy' : 'note');
	}
}

async function loadUnloadedNotes() {
	if (document.hidden) return;
	if (tlComponent.value == null) return;
	if (notVisibleNoteData.length === 0) return;

	tlComponent.value.pagingComponent?.stopFetch();
	try {
		const items = [...notVisibleNoteData];
		notVisibleNoteData.length = 0;

		const notes = await Promise.allSettled(items.map(fulfillNoteData));
		if (items.length >= 10) tlComponent.value.pagingComponent?.deleteItem();

		for (const note of notes.filter(i => i.status === 'fulfilled' && i.value != null)) {
			await prepend((note as PromiseFulfilledResult<object>).value);
		}
	} finally {
		tlComponent.value.pagingComponent?.startFetch();
	}
}

let connection: Misskey.ChannelConnection | null = null;
let connection2: Misskey.ChannelConnection | null = null;
let paginationQuery: Paging | null = null;

const stream = useStream();

function connectChannel() {
	if (props.src === 'antenna') {
		if (props.antenna == null) return;
		connection = stream.useChannel('antenna', {
			antennaId: props.antenna,
			minimize: true,
		});
	} else if (props.src === 'home') {
		connection = stream.useChannel('homeTimeline', {
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
			minimize: true,
		});
		connection2 = stream.useChannel('main');
	} else if (props.src === 'local') {
		connection = stream.useChannel('localTimeline', {
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: props.onlyFiles ? true : undefined,
			minimize: true,
		});
	} else if (props.src === 'media') {
		connection = stream.useChannel('hybridTimeline', {
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: true,
			minimize: true,
		});
	} else if (props.src === 'social') {
		connection = stream.useChannel('hybridTimeline', {
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: props.onlyFiles ? true : undefined,
			minimize: true,
		});
	} else if (props.src === 'global') {
		connection = stream.useChannel('globalTimeline', {
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
			minimize: true,
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
			minimize: true,
		});
	} else if (props.src === 'channel') {
		if (props.channel == null) return;
		connection = stream.useChannel('channel', {
			channelId: props.channel,
			minimize: true,
		});
	} else if (props.src === 'role') {
		if (props.role == null) return;
		connection = stream.useChannel('roleTimeline', {
			roleId: props.role,
			minimize: true,
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
	} else if (props.src === 'media') {
		endpoint = 'notes/hybrid-timeline';
		query = {
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
			withFiles: true,
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
	if (!defaultStore.state.disableStreamingTimeline) {
		disconnectChannel();
		connectChannel();
	}

	updatePaginationQuery();
}

// デッキのリストカラムでwithRenotesを変更した場合に自動的に更新されるようにさせる
// IDが切り替わったら切り替え先のTLを表示させたい
watch(() => [props.list, props.antenna, props.channel, props.role, props.withRenotes], refreshEndpointAndChannel);

// 初回表示用
refreshEndpointAndChannel();

onMounted(() => {
	document.addEventListener('visibilitychange', loadUnloadedNotes);
});

onUnmounted(() => {
	disconnectChannel();
	document.removeEventListener('visibilitychange', loadUnloadedNotes);
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
