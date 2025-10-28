<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="history.length > 0" class="_gaps_s">
	<MkA
		v-for="item in history"
		:key="item.id"
		:class="[$style.message, { [$style.isMe]: item.isMe, [$style.isRead]: item.message.isRead }]"
		class="_panel"
		:to="item.message.toRoomId ? `/chat/room/${item.message.toRoomId}` : `/chat/user/${item.other!.id}`"
	>
		<MkAvatar v-if="item.message.toRoomId" :class="$style.messageAvatar" :user="item.message.fromUser" indicator :preview="false"/>
		<MkAvatar v-else-if="item.other" :class="$style.messageAvatar" :user="item.other" indicator :preview="false"/>
		<div :class="$style.messageBody">
			<header v-if="item.message.toRoom" :class="$style.messageHeader">
				<span :class="$style.messageHeaderName"><i class="ti ti-users"></i> {{ item.message.toRoom.name }}</span>
				<MkTime :time="item.message.createdAt" :class="$style.messageHeaderTime"/>
			</header>
			<header v-else :class="$style.messageHeader">
				<MkUserName :class="$style.messageHeaderName" :user="item.other!"/>
				<MkAcct :class="$style.messageHeaderUsername" :user="item.other!"/>
				<MkTime :time="item.message.createdAt" :class="$style.messageHeaderTime"/>
			</header>
			<div :class="$style.messageBodyText"><span v-if="item.isMe" :class="$style.youSaid">{{ i18n.ts.you }}:</span>{{ item.message.text }}</div>
		</div>
	</MkA>
</div>
<MkResult v-if="!initializing && history.length == 0" type="empty" :text="i18n.ts._chat.noHistory"/>
<MkLoading v-if="initializing"/>
</template>

<script lang="ts" setup>
import { onActivated, onDeactivated, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@@/js/use-interval.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i.js';

const $i = ensureSignin();

const history = ref<{
	id: string;
	message: Misskey.entities.ChatMessage;
	other: Misskey.entities.ChatMessage['fromUser'] | Misskey.entities.ChatMessage['toUser'] | null;
	isMe: boolean;
}[]>([]);

const initializing = ref(true);
const fetching = ref(false);

async function fetchHistory() {
	if (fetching.value) return;

	fetching.value = true;

	const [userMessages, roomMessages] = await Promise.all([
		misskeyApi('chat/history', { room: false }),
		misskeyApi('chat/history', { room: true }),
	]);

	history.value = [...userMessages, ...roomMessages]
		.toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.map(m => ({
			id: m.id,
			message: m,
			other: (!('room' in m) || m.room == null) ? (m.fromUserId === $i.id ? m.toUser : m.fromUser) : null,
			isMe: m.fromUserId === $i.id,
		}));

	fetching.value = false;
	initializing.value = false;
}

let isActivated = true;

onActivated(() => {
	isActivated = true;
});

onDeactivated(() => {
	isActivated = false;
});

useInterval(() => {
	// TODO: DOM的にバックグラウンドになっていないかどうかも考慮する
	if (!window.document.hidden && isActivated) {
		fetchHistory();
	}
}, 1000 * 10, {
	immediate: false,
	afterMounted: true,
});

onActivated(() => {
	fetchHistory();
});

onMounted(() => {
	fetchHistory();
});
</script>

<style lang="scss" module>
.message {
	position: relative;
	display: flex;
	padding: 16px 24px;

	&.isRead,
	&.isMe {
		opacity: 0.8;
	}

	&:not(.isMe):not(.isRead) {
		&::before {
			content: '';
			position: absolute;
			top: 8px;
			right: 8px;
			width: 8px;
			height: 8px;
			border-radius: 100%;
			background-color: var(--MI_THEME-accent);
		}
	}
}

@container (max-width: 500px) {
	.message {
		font-size: 90%;
		padding: 14px 20px;
	}
}

@container (max-width: 450px) {
	.message {
		font-size: 80%;
		padding: 12px 16px;
	}
}

.messageAvatar {
	width: 50px;
	height: 50px;
	margin: 0 16px 0 0;
}

@container (max-width: 500px) {
	.messageAvatar {
		width: 45px;
		height: 45px;
	}
}

@container (max-width: 450px) {
	.messageAvatar {
		width: 40px;
		height: 40px;
	}
}

.messageBody {
	flex: 1;
	min-width: 0;
}

.messageHeader {
	display: flex;
	align-items: center;
	margin-bottom: 2px;
	white-space: nowrap;
	overflow: clip;
}

.messageHeaderName {
	margin: 0;
	padding: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	font-size: 1em;
	font-weight: bold;
}

.messageHeaderUsername {
	margin: 0 8px;
}

.messageHeaderTime {
	margin-left: auto;
}

.messageBodyText {
	overflow: hidden;
	overflow-wrap: break-word;
	font-size: 1.1em;
}

.youSaid {
	font-weight: bold;
	margin-right: 0.5em;
}
</style>
