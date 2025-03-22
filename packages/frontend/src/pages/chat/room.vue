<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader reversed>
	<MkSpacer :contentMax="700">
		<MkPagination v-if="pagination" ref="pagingComponent" :key="userId || roomId" :pagination="pagination" :disableAutoLoad="true" :scrollReversed="true">
			<template #empty>
				<div class="_gaps" style="text-align: center;">
					<div>{{ i18n.ts.noMessagesYet }}</div>
					<template v-if="user">
						<div v-if="user.chatScope === 'followers'">{{ i18n.ts._chat.thisUserAllowsChatOnlyFromFollowers }}</div>
						<div v-else-if="user.chatScope === 'following'">{{ i18n.ts._chat.thisUserAllowsChatOnlyFromFollowing }}</div>
						<div v-else-if="user.chatScope === 'mutual'">{{ i18n.ts._chat.thisUserAllowsChatOnlyFromMutualFollowing }}</div>
						<div v-else>{{ i18n.ts._chat.thisUserNotAllowedChatAnyone }}</div>
					</template>
				</div>
			</template>
			<template #default="{ items: messages }">
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
			</template>
		</MkPagination>
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
				<XForm v-if="!fetching" :user="user" :room="room" :class="$style.form"/>
			</div>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue';
import * as Misskey from 'misskey-js';
import { isTailVisible } from '@@/js/scroll.js';
import XMessage from './room.message.vue';
import XForm from './room.form.vue';
import type { Paging } from '@/components/MkPagination.vue';
import MkDateSeparatedList from '@/components/MkDateSeparatedList.vue';
import MkPagination from '@/components/MkPagination.vue';
import * as os from '@/os.js';
import { useStream } from '@/stream.js';
import * as sound from '@/utility/sound.js';
import { i18n } from '@/i18n.js';
import { ensureSignin } from '@/i.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { prefer } from '@/preferences.js';

const $i = ensureSignin();

const props = defineProps<{
	userId?: string;
	roomId?: string;
}>();

const pagingComponent = useTemplateRef('pagingComponent');

const fetching = ref(true);
const user = ref<Misskey.entities.UserDetailed | null>(null);
const room = ref<Misskey.entities.ChatRoom | null>(null);
const connection = ref<Misskey.ChannelConnection<Misskey.Channels['chat']> | null>(null);
const showIndicator = ref(false);

const pagination = ref<Paging | null>(null);

watch([() => props.userId, () => props.roomId], () => {
	if (connection.value) connection.value.dispose();
	fetch();
});

async function fetch() {
	fetching.value = true;

	if (props.userId) {
		user.value = await misskeyApi('users/show', { userId: props.userId });
		room.value = null;

		pagination.value = {
			endpoint: 'chat/messages/timeline',
			limit: 20,
			params: {
				userId: user.value.id,
			},
			reversed: true,
		};
		connection.value = useStream().useChannel('chat', {
			otherId: user.value.id,
		});
	}/* else {
		user = null;
		room = await misskeyApi('users/rooms/show', { roomId: props.roomId });

		pagination = {
			endpoint: 'chat/messages',
			limit: 20,
			params: {
				roomId: room?.id,
			},
			reversed: true,
		};
		connection = useStream().useChannel('chat', {
			room: room?.id,
		});
	}*/

	connection.value.on('message', onMessage);
	connection.value.on('deleted', onDeleted);

	window.document.addEventListener('visibilitychange', onVisibilitychange);

	fetching.value = false;
}

function onMessage(message) {
	//sound.play('chat');

	pagingComponent.value.prepend(message);
	if (message.userId !== $i.id && !window.document.hidden) {
		connection.value?.send('read', {
			id: message.id,
		});
	}

	if (message.userId !== $i.id) {
		notifyNewMessage();
	}
}

function onDeleted(id) {
	const msg = pagingComponent.value.items.find(m => m.id === id);
	if (msg) {
		pagingComponent.value.items = pagingComponent.value.items.filter(m => m.id !== msg.id);
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
	for (const message of pagingComponent.value.items) {
		if (message.userId !== $i.id && !message.isRead) {
			connection.value?.send('read', {
				id: message.id,
			});
		}
	}
}

onMounted(() => {
	fetch();
});

onBeforeUnmount(() => {
	connection.value?.dispose();
	window.document.removeEventListener('visibilitychange', onVisibilitychange);
});

definePage(computed(() => !fetching.value ? user.value ? {
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
	display: block;
	margin: 16px auto;
	padding: 0 12px;
	line-height: 24px;
	color: #fff;
	background: rgba(#000, 0.3);
	border-radius: 12px;

	&:hover {
		background: rgba(#000, 0.4);
	}

	&:active {
		background: rgba(#000, 0.5);
	}
}

.fetching {
	cursor: wait;
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
