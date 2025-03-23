<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader reversed>
	<MkSpacer :contentMax="700">
		<div v-if="initializing">
			<MkLoading/>
		</div>
		<div v-else-if="messages.length === 0">
			<div class="_gaps" style="text-align: center;">
				<div>{{ i18n.ts.noMessagesYet }}</div>
				<template v-if="user">
					<div v-if="user.chatScope === 'followers'">{{ i18n.ts._chat.thisUserAllowsChatOnlyFromFollowers }}</div>
					<div v-else-if="user.chatScope === 'following'">{{ i18n.ts._chat.thisUserAllowsChatOnlyFromFollowing }}</div>
					<div v-else-if="user.chatScope === 'mutual'">{{ i18n.ts._chat.thisUserAllowsChatOnlyFromMutualFollowing }}</div>
					<div v-else>{{ i18n.ts._chat.thisUserNotAllowedChatAnyone }}</div>
				</template>
			</div>
		</div>
		<div v-else class="_gaps">
			<div v-if="canFetchMore">
				<MkButton :class="$style.more" :wait="moreFetching" primary rounded @click="fetchMore">{{ i18n.ts.loadMore }}</MkButton>
			</div>

			<TransitionGroup
				:enterActiveClass="prefer.s.animation ? $style.transition_x_enterActive : ''"
				:leaveActiveClass="prefer.s.animation ? $style.transition_x_leaveActive : ''"
				:enterFromClass="prefer.s.animation ? $style.transition_x_enterFrom : ''"
				:leaveToClass="prefer.s.animation ? $style.transition_x_leaveTo : ''"
				:moveClass="prefer.s.animation ? $style.transition_x_move : ''"
				tag="div" class="_gaps"
			>
				<XMessage v-for="message in messages.toReversed()" :key="message.id" :message="message" :user="message.fromUserId === $i.id ? $i : user" :isRoom="room != null"/>
			</TransitionGroup>
		</div>
	</MkSpacer>

	<template #footer>
		<div :class="$style.footer">
			<div class="_gaps">
				<Transition name="fade">
					<div v-show="showIndicator" :class="$style.new">
						<button class="_buttonPrimary" :class="$style.newButton" @click="onIndicatorClick">
							<i class="fas ti-fw fa-arrow-circle-down" :class="$style.newIcon"></i>{{ i18n.ts.newMessageExists }}
						</button>
					</div>
				</Transition>
				<XForm v-if="!initializing" :user="user" :room="room" :class="$style.form"/>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef, computed, watch, onMounted, nextTick, onBeforeUnmount, onDeactivated, onActivated } from 'vue';
import * as Misskey from 'misskey-js';
import { isTailVisible } from '@@/js/scroll.js';
import XMessage from './room.message.vue';
import XForm from './room.form.vue';
import * as os from '@/os.js';
import { useStream } from '@/stream.js';
import * as sound from '@/utility/sound.js';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { prefer } from '@/preferences.js';
import MkButton from '@/components/MkButton.vue';

const $i = ensureSignin();

const props = defineProps<{
	userId?: string;
	roomId?: string;
}>();

const initializing = ref(true);
const moreFetching = ref(false);
const messages = ref<Misskey.entities.ChatMessage[]>([]);
const canFetchMore = ref(false);
const user = ref<Misskey.entities.UserDetailed | null>(null);
const room = ref<Misskey.entities.ChatRoom | null>(null);
const connection = ref<Misskey.ChannelConnection<Misskey.Channels['chat']> | null>(null);
const showIndicator = ref(false);

async function initialize() {
	const LIMIT = 20;

	initializing.value = true;

	if (props.userId) {
		const [u, m] = await Promise.all([
			misskeyApi('users/show', { userId: props.userId }),
			misskeyApi('chat/messages/timeline', { userId: props.userId, limit: LIMIT }),
		]);

		user.value = u;
		messages.value = m;

		if (messages.value.length === LIMIT) {
			canFetchMore.value = true;
		}

		connection.value = useStream().useChannel('chatUser', {
			otherId: user.value.id,
		});
		connection.value.on('message', onMessage);
		connection.value.on('deleted', onDeleted);
	} else {
		const [r, m] = await Promise.all([
			misskeyApi('chat/rooms/show', { roomId: props.roomId }),
			misskeyApi('chat/messages/timeline', { roomId: props.roomId, limit: LIMIT }),
		]);

		room.value = r;
		messages.value = m;

		if (messages.value.length === LIMIT) {
			canFetchMore.value = true;
		}

		connection.value = useStream().useChannel('chatRoom', {
			otherId: user.value.id,
		});
		connection.value.on('message', onMessage);
		connection.value.on('deleted', onDeleted);
	}

	window.document.addEventListener('visibilitychange', onVisibilitychange);

	initializing.value = false;
}

let isActivated = true;

onActivated(() => {
	isActivated = true;
});

onDeactivated(() => {
	isActivated = false;
});

function fetchMore() {
	const LIMIT = 30;

	moreFetching.value = true;

	misskeyApi('chat/messages/timeline', {
		userId: user.value.id,
		limit: LIMIT,
		untilId: messages.value[messages.value.length - 1].id,
	}).then(newMessages => {
		messages.value.push(...newMessages);

		canFetchMore.value = newMessages.length === LIMIT;
		moreFetching.value = false;
	});
}

function onMessage(message: Misskey.entities.ChatMessage) {
	//sound.play('chat');

	messages.value.unshift(message);

	// TODO: DOM的にバックグラウンドになっていないかどうかも考慮する
	if (message.fromUserId !== $i.id && !window.document.hidden && isActivated) {
		connection.value?.send('read', {
			id: message.id,
		});
	}

	if (message.fromUserId !== $i.id) {
		//notifyNewMessage();
	}
}

function onDeleted(id) {
	const index = messages.value.findIndex(m => m.id === id);
	if (index !== -1) {
		messages.value.splice(index, 1);
	}
}

function onIndicatorClick() {
	showIndicator.value = false;
}

function notifyNewMessage() {
	showIndicator.value = true;
}

function onVisibilitychange() {
	if (window.document.hidden) return;
	// TODO
}

onMounted(() => {
	initialize();
});

onBeforeUnmount(() => {
	connection.value?.dispose();
	window.document.removeEventListener('visibilitychange', onVisibilitychange);
});

definePage(computed(() => !initializing.value ? user.value ? {
	userName: user,
	avatar: user,
} : {
	title: room.value?.name,
	icon: 'ti ti-users',
} : null));
</script>

<style lang="scss" module>
.transition_x_move,
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.2s cubic-bezier(0,.5,.5,1), transform 0.2s cubic-bezier(0,.5,.5,1) !important;
}
.transition_x_enterFrom,
.transition_x_leaveTo {
	opacity: 0;
	transform: translateY(80px);
}
.transition_x_leaveActive {
	position: absolute;
}

.root {
}

.more {
	margin: 0 auto;
}

.footer {
	width: 100%;
	position: sticky;
	z-index: 2;
	padding-top: 8px;
	bottom: var(--minBottomSpacing);
}

.new {
	width: 100%;
	padding-bottom: 8px;
	text-align: center;
}

.newButton {
	display: inline-block;
	margin: 0;
	padding: 0 12px;
	line-height: 32px;
	font-size: 12px;
	border-radius: 16px;
}

.newIcon {
	display: inline-block;
	margin-right: 8px;
}

.footer {

}

.form {
	margin: 0 auto;
	width: 100%;
	max-width: 700px;
}

.fade-enter-active, .fade-leave-active {
	transition: opacity 0.1s;
}

.fade-enter-from, .fade-leave-to {
	transition: opacity 0.5s;
	opacity: 0;
}
</style>
