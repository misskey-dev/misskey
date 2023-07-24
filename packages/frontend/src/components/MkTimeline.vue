<template>
<div>
	<div v-if="queueSize > 0" :class="$style.new"><button class="_buttonPrimary" :class="$style.newButton" @click="reload()">{{ i18n.ts.goToTheHeadOfTimeline }}</button></div>
	<div v-if="(((src === 'local' || src === 'social') && !isLocalTimelineAvailable) || (src === 'global' && !isGlobalTimelineAvailable))" :class="$style.disabled">
		<p :class="$style.disabledTitle">
			<i class="ti ti-circle-minus"></i>
			{{ i18n.ts._disabledTimeline.title }}
		</p>
		<p :class="$style.disabledDescription">{{ i18n.ts._disabledTimeline.description }}</p>
	</div>
	<MkNotes v-else ref="tlComponent" :noGap="!defaultStore.state.showGapBetweenNotesInTimeline" :pagination="pagination"/>
</div>
</template>

<script lang="ts" setup>
import { computed, provide, onUnmounted } from 'vue';
import MkNotes from '@/components/MkNotes.vue';
import { useStream } from '@/stream';
import * as sound from '@/scripts/sound';
import { $i } from '@/account';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import { instance } from '@/instance';

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
	(ev: 'reload'): void;
}>();

const isLocalTimelineAvailable = (($i == null && instance.policies.ltlAvailable) || ($i != null && $i.policies.ltlAvailable));
const isGlobalTimelineAvailable = (($i == null && instance.policies.gtlAvailable) || ($i != null && $i.policies.gtlAvailable));

provide('inChannel', computed(() => props.src === 'channel'));

let tlComponent: InstanceType<typeof MkNotes> | undefined = $ref();

const queueSize = computed(() => {
	return tlComponent?.pagingComponent?.queueSize ?? 0;
});

const prepend = note => {
	tlComponent?.pagingComponent?.prepend(note);

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
		withReplies: defaultStore.state.showTimelineReplies,
	};
	connection = stream.useChannel('homeTimeline', {
		withReplies: defaultStore.state.showTimelineReplies,
	});
	connection.on('note', prepend);

	connection2 = stream.useChannel('main');
} else if (props.src === 'local') {
	endpoint = 'notes/local-timeline';
	query = {
		withReplies: defaultStore.state.showTimelineReplies,
	};
	connection = stream.useChannel('localTimeline', {
		withReplies: defaultStore.state.showTimelineReplies,
	});
	connection.on('note', prepend);
} else if (props.src === 'social') {
	endpoint = 'notes/hybrid-timeline';
	query = {
		withReplies: defaultStore.state.showTimelineReplies,
	};
	connection = stream.useChannel('hybridTimeline', {
		withReplies: defaultStore.state.showTimelineReplies,
	});
	connection.on('note', prepend);
} else if (props.src === 'global') {
	endpoint = 'notes/global-timeline';
	query = {
		withReplies: defaultStore.state.showTimelineReplies,
	};
	connection = stream.useChannel('globalTimeline', {
		withReplies: defaultStore.state.showTimelineReplies,
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
		listId: props.list,
	};
	connection = stream.useChannel('userList', {
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

const reload = () => {
	tlComponent?.pagingComponent?.reload();
	emit('reload');
};

defineExpose({
	reload,
	queueSize,
});
</script>

<style lang="scss" module>
.new {
	position: sticky;
	top: calc(var(--stickyTop, 0px) + 12px);
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

.disabled {
	text-align: center;
}

.disabledTitle {
	margin: 16px;
}

.disabledDescription {
	font-size: 90%;
	margin: 16px;
}
</style>
