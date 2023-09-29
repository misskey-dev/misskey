<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkNotes ref="tlComponent" :noGap="!defaultStore.state.showGapBetweenNotesInTimeline" :pagination="pagination" @queue="emit('queue', $event)"/>
</template>

<script lang="ts" setup>
import { computed, provide, onUnmounted } from 'vue';
import MkNotes from '@/components/MkNotes.vue';
import { useStream } from '@/stream.js';
import * as sound from '@/scripts/sound.js';
import { $i } from '@/account.js';
import { defaultStore } from '@/store.js';

const props = withDefaults(defineProps<{
	src: string;
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

provide('inChannel', computed(() => props.src === 'channel'));

const tlComponent: InstanceType<typeof MkNotes> = $ref();

const prepend = note => {
	tlComponent.pagingComponent?.prepend(note);

	emit('note');

	if (props.sound) {
		sound.play($i && (note.userId === $i.id) ? 'noteMy' : 'note');
	}
};

let endpoint;
let query;
let connection;
let connection2;

const stream = useStream();

if (props.src === 'antenna') {
	endpoint = 'antennas/notes';
	query = {
		antennaId: props.antenna,
	};
	connection = stream.useChannel('antenna', {
		antennaId: props.antenna,
	});
	connection.on('note', prepend);
} else if (props.src === 'home') {
	endpoint = 'notes/timeline';
	query = {
		withRenotes: props.withRenotes,
		withReplies: props.withReplies,
		withFiles: props.onlyFiles ? true : undefined,
	};
	connection = stream.useChannel('homeTimeline', {
		withRenotes: props.withRenotes,
		withReplies: props.withReplies,
		withFiles: props.onlyFiles ? true : undefined,
	});
	connection.on('note', prepend);

	connection2 = stream.useChannel('main');
} else if (props.src === 'local') {
	endpoint = 'notes/local-timeline';
	query = {
		withRenotes: props.withRenotes,
		withReplies: props.withReplies,
		withFiles: props.onlyFiles ? true : undefined,
	};
	connection = stream.useChannel('localTimeline', {
		withRenotes: props.withRenotes,
		withReplies: props.withReplies,
		withFiles: props.onlyFiles ? true : undefined,
	});
	connection.on('note', prepend);
} else if (props.src === 'media') {
	endpoint = 'notes/hybrid-timeline';
	query = {
		withFiles: true,
		withReplies: defaultStore.state.showTimelineReplies,
	};
	connection = stream.useChannel('hybridTimeline', {
		withFiles: true,
		withReplies: defaultStore.state.showTimelineReplies,
	});
	connection.on('note', prepend);
} else if (props.src === 'social') {
	endpoint = 'notes/hybrid-timeline';
	query = {
		withRenotes: props.withRenotes,
		withReplies: props.withReplies,
		withFiles: props.onlyFiles ? true : undefined,
	};
	connection = stream.useChannel('hybridTimeline', {
		withRenotes: props.withRenotes,
		withReplies: props.withReplies,
		withFiles: props.onlyFiles ? true : undefined,
	});
	connection.on('note', prepend);
} else if (props.src === 'global') {
	endpoint = 'notes/global-timeline';
	query = {
		withRenotes: props.withRenotes,
		withReplies: props.withReplies,
		withFiles: props.onlyFiles ? true : undefined,
	};
	connection = stream.useChannel('globalTimeline', {
		withRenotes: props.withRenotes,
		withReplies: props.withReplies,
		withFiles: props.onlyFiles ? true : undefined,
	});
	connection.on('note', prepend);
} else if (props.src === 'mentions') {
	endpoint = 'notes/mentions';
	connection = stream.useChannel('main');
	connection.on('mention', prepend);
} else if (props.src === 'directs') {
	endpoint = 'notes/mentions';
	query = {
		visibility: 'specified',
	};
	const onNote = note => {
		if (note.visibility === 'specified') {
			prepend(note);
		}
	};
	connection = stream.useChannel('main');
	connection.on('mention', onNote);
} else if (props.src === 'list') {
	endpoint = 'notes/user-list-timeline';
	query = {
		withRenotes: props.withRenotes,
		withReplies: props.withReplies,
		withFiles: props.onlyFiles ? true : undefined,
		listId: props.list,
	};
	connection = stream.useChannel('userList', {
		withRenotes: props.withRenotes,
		withReplies: props.withReplies,
		withFiles: props.onlyFiles ? true : undefined,
		listId: props.list,
	});
	connection.on('note', prepend);
} else if (props.src === 'channel') {
	endpoint = 'channels/timeline';
	query = {
		channelId: props.channel,
	};
	connection = stream.useChannel('channel', {
		channelId: props.channel,
	});
	connection.on('note', prepend);
} else if (props.src === 'role') {
	endpoint = 'roles/notes';
	query = {
		roleId: props.role,
	};
	connection = stream.useChannel('roleTimeline', {
		roleId: props.role,
	});
	connection.on('note', prepend);
}

const pagination = {
	endpoint: endpoint,
	limit: 10,
	params: query,
};

onUnmounted(() => {
	connection.dispose();
	if (connection2) connection2.dispose();
});

/* TODO
const timetravel = (date?: Date) => {
	this.date = date;
	this.$refs.tl.reload();
};
*/
</script>
