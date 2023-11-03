<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPullToRefresh ref="prComponent" :refresher="() => reloadTimeline()">
	<MkNotes ref="tlComponent" :noGap="!defaultStore.state.showGapBetweenNotesInTimeline" :pagination="pagination" @queue="emit('queue', $event)" @status="prComponent.setDisabled($event)"/>
</MkPullToRefresh>
</template>

<script lang="ts" setup>
import { computed, provide, onUnmounted } from 'vue';
import MkNotes from '@/components/MkNotes.vue';
import MkPullToRefresh from '@/components/MkPullToRefresh.vue';
import { useStream, reloadStream } from '@/stream';
import * as sound from '@/scripts/sound';
import { $i } from '@/account';
import { defaultStore } from '@/store';

const props = defineProps<{
	src: string;
	list?: string;
	antenna?: string;
	channel?: string;
	role?: string;
	sound?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'note'): void;
	(ev: 'queue', count: number): void;
}>();

provide('inChannel', computed(() => props.src === 'channel'));

const prComponent: InstanceType<typeof MkPullToRefresh> = $ref();
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
const connectChannel = () => {
	if (props.src === 'antenna') {
		connection = stream.useChannel('antenna', {
			antennaId: props.antenna,
		});
		connection.on('note', prepend);
	} else if (props.src === 'home') {
		connection = stream.useChannel('homeTimeline', {
			withReplies: defaultStore.state.showTimelineReplies,
		});
		connection.on('note', prepend);

		connection2 = stream.useChannel('main');
	} else if (props.src === 'local') {
		connection = stream.useChannel('localTimeline', {
			withReplies: defaultStore.state.showTimelineReplies,
		});
		connection.on('note', prepend);
	} else if (props.src === 'media') {
		connection = stream.useChannel('hybridTimeline', {
			withFiles: true,
			withReplies: defaultStore.state.showTimelineReplies,
		});
		connection.on('note', prepend);
	} else if (props.src === 'social') {
		connection = stream.useChannel('hybridTimeline', {
			withReplies: defaultStore.state.showTimelineReplies,
		});
		connection.on('note', prepend);
	} else if (props.src === 'global') {
		connection = stream.useChannel('globalTimeline', {
			withReplies: defaultStore.state.showTimelineReplies,
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
		connection = stream.useChannel('userList', {
			listId: props.list,
		});
		connection.on('note', prepend);
	} else if (props.src === 'channel') {
		connection = stream.useChannel('channel', {
			channelId: props.channel,
		});
		connection.on('note', prepend);
	} else if (props.src === 'role') {
		connection = stream.useChannel('roleTimeline', {
			roleId: props.role,
		});
		connection.on('note', prepend);
	}
};

if (props.src === 'antenna') {
	endpoint = 'antennas/notes';
	query = {
		antennaId: props.antenna,
	};
} else if (props.src === 'home') {
	endpoint = 'notes/timeline';
	query = {
		withReplies: defaultStore.state.showTimelineReplies,
	};
} else if (props.src === 'local') {
	endpoint = 'notes/local-timeline';
	query = {
		withReplies: defaultStore.state.showTimelineReplies,
	};
} else if (props.src === 'media') {
	endpoint = 'notes/hybrid-timeline';
	query = {
		withFiles: true,
		withReplies: defaultStore.state.showTimelineReplies,
	};
} else if (props.src === 'social') {
	endpoint = 'notes/hybrid-timeline';
	query = {
		withReplies: defaultStore.state.showTimelineReplies,
	};
} else if (props.src === 'global') {
	endpoint = 'notes/global-timeline';
	query = {
		withReplies: defaultStore.state.showTimelineReplies,
	};
} else if (props.src === 'mentions') {
	endpoint = 'notes/mentions';
} else if (props.src === 'directs') {
	endpoint = 'notes/mentions';
	query = {
		visibility: 'specified',
	};
} else if (props.src === 'list') {
	endpoint = 'notes/user-list-timeline';
	query = {
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
}

if (!defaultStore.state.disableStreamingTimeline) {
	connectChannel();

	onUnmounted(() => {
		connection.dispose();
		if (connection2) connection2.dispose();
	});
}

const pagination = {
	endpoint: endpoint,
	limit: 10,
	params: query,
};

function reloadTimeline() {
	return new Promise<void>((res) => {
		tlComponent.pagingComponent?.reload().then(() => {
			reloadStream();
			res();
		});
	});
}

defineExpose({
	reloadTimeline,
});
</script>
