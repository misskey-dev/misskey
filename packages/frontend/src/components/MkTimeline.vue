<!--
SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPullToRefresh ref="prComponent" :refresher="() => reloadTimeline()">
	<MkNotes
		v-if="paginationQuery"
		ref="tlComponent"
		:pagination="paginationQuery"
		:noGap="!defaultStore.state.showGapBetweenNotesInTimeline"
		:withCw="props.withCw"
		@queue="emit('queue', $event)"
		@status="prComponent?.setDisabled($event)"
	/>
</MkPullToRefresh>
</template>

<script lang="ts" setup>
import { computed, watch, onUnmounted, provide, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import type { BasicTimelineType } from '@/timelines.js';
import MkNotes from '@/components/MkNotes.vue';
import MkPullToRefresh from '@/components/MkPullToRefresh.vue';
import { useStream } from '@/stream.js';
import * as sound from '@/scripts/sound.js';
import { $i } from '@/account.js';
import { instance } from '@/instance.js';
import { defaultStore } from '@/store.js';
import { Paging } from '@/components/MkPagination.vue';

const props = withDefaults(defineProps<{
	src: BasicTimelineType | 'mentions' | 'directs' | 'list' | 'antenna' | 'channel' | 'role' | 'media';
	list?: string;
	antenna?: string;
	channel?: string;
	role?: string;
	sound?: boolean;
	withRenotes?: boolean;
	withReplies?: boolean;
	onlyFiles?: boolean;
	withCw?: boolean;
}>(), {
	withRenotes: true,
	withReplies: false,
	onlyFiles: false,
	withCw: false,
});

const emit = defineEmits<{
	(ev: 'note'): void;
	(ev: 'queue', count: number): void;
}>();

provide('inTimeline', true);
provide('inChannel', computed(() => props.src === 'channel'));

const prComponent = shallowRef<InstanceType<typeof MkPullToRefresh>>();
const tlComponent = shallowRef<InstanceType<typeof MkNotes>>();

let tlNotesCount = 0;

function prepend(note) {
	if (!tlComponent.value) return;

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

let connection: Misskey.ChannelConnection | null = null;
let connection2: Misskey.ChannelConnection | null = null;
let paginationQuery: Paging | null = null;

const stream = useStream();

function connectChannel() {
	if (props.src === 'antenna' && props.antenna) {
		connection = stream.useChannel('antenna', { antennaId: props.antenna });
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
	} else if (props.src === 'media') {
		connection = stream.useChannel('hybridTimeline', {
			withFiles: true,
			withRenotes: props.withRenotes,
			withReplies: props.withReplies,
		});
	} else if (props.src === 'social' || props.src === 'global') {
		const channel = props.src === 'social' ? 'hybridTimeline' : 'globalTimeline';
		connection = stream.useChannel(channel, {
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
		});
	} else if (props.src === 'mentions') {
		connection = stream.useChannel('main');
		connection.on('mention', prepend);
	} else if (props.src === 'directs') {
		const onNote = note => {
			if (note.visibility === 'specified') prepend(note);
		};
		connection = stream.useChannel('main');
		connection.on('mention', onNote);
	} else if (props.src === 'list' && props.list) {
		connection = stream.useChannel('userList', {
			withRenotes: props.withRenotes,
			withFiles: props.onlyFiles ? true : undefined,
			listId: props.list,
		});
	} else if (props.src === 'channel' && props.channel) {
		connection = stream.useChannel('channel', { channelId: props.channel });
	} else if (props.src === 'role' && props.role) {
		connection = stream.useChannel('roleTimeline', { roleId: props.role });
	}

	if (props.src !== 'directs' && props.src !== 'mentions') {
		connection?.on('note', prepend);
	}
}

function disconnectChannel() {
	if (connection) connection.dispose();
	if (connection2) connection2.dispose();
}

function updatePaginationQuery() {
	const endpoints = {
		antenna: 'antennas/notes',
		home: 'notes/timeline',
		local: 'notes/local-timeline',
		social: 'notes/hybrid-timeline',
		global: 'notes/global-timeline',
		media: 'notes/hybrid-timeline',
		mentions: 'notes/mentions',
		directs: 'notes/mentions',
		list: 'notes/user-list-timeline',
		channel: 'channels/timeline',
		role: 'roles/notes',
	};

	const queries = {
		antenna: { antennaId: props.antenna },
		home: { withRenotes: props.withRenotes, withFiles: props.onlyFiles ? true : undefined },
		local: { withRenotes: props.withRenotes, withReplies: props.withReplies, withFiles: props.onlyFiles ? true : undefined },
		social: { withRenotes: props.withRenotes, withReplies: props.withReplies, withFiles: props.onlyFiles ? true : undefined },
		global: { withRenotes: props.withRenotes, withFiles: props.onlyFiles ? true : undefined },
		media: { withFiles: true, withRenotes: props.withRenotes, withReplies: false },
		mentions: null,
		directs: { visibility: 'specified' },
		list: { withRenotes: props.withRenotes, withFiles: props.onlyFiles ? true : undefined, listId: props.list },
		channel: { channelId: props.channel },
		role: { roleId: props.role },
	};
	if (props.src.startsWith('remoteLocalTimeline')) {
		paginationQuery = {
			endpoint: 'notes/any-local-timeline',
			limit: 10,
			params: {
				host: props.list,
			},
		};
	} else {
		const endpoint = endpoints[props.src];
		const query = queries[props.src];
		paginationQuery = endpoint && query ? { endpoint, limit: 10, params: query } : null;
	}
}

function refreshEndpointAndChannel() {
	if (!defaultStore.state.disableStreamingTimeline) {
		disconnectChannel();
		connectChannel();
	}
	updatePaginationQuery();
}

watch(() => [props.list, props.antenna, props.channel, props.role, props.withRenotes], refreshEndpointAndChannel);

// 初回表示用
refreshEndpointAndChannel();

onUnmounted(() => {
	disconnectChannel();
});

function reloadTimeline() {
	return new Promise<void>((res) => {
		if (!tlComponent.value) return;

		tlNotesCount = 0;

		tlComponent.value.pagingComponent?.reload().then(() => res());
	});
}

defineExpose({
	reloadTimeline,
});
</script>
