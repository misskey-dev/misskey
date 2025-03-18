<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div style="height: 100vh; overflow:auto; display:flex; flex-direction:column-reverse;">
	<MkStickyContainer>
		<template #header>
			<MkPageHeader/>
		</template>

		<div ref="rootEl" :class="$style.root">
			<MkSpacer :contentMax="700">
				<MkPagination v-if="pagination" ref="pagingComponent" :key="userId || roomId" :pagination="pagination" :disableAutoLoad="true">
					<template #empty>
						<div class="_fullinfo">
							<div>{{ i18n.ts.noMessagesYet }}</div>
						</div>
					</template>
					<template #default="{ items: messages, fetching: pFetching }">
						<MkDateSeparatedList
							v-if="messages.length > 0"
							v-slot="{ item: message }"
							:class="{ [$style['messages']]: true, 'deny-move-transition': pFetching }"
							:items="messages"
							direction="up"
							reversed
						>
							<XMessage :key="message.id" :message="message" :user="message.fromUserId === $i.id ? $i : user" :isRoom="room != null"/>
						</MkDateSeparatedList>
					</template>
				</MkPagination>
			</MkSpacer>
		</div>

		<template #footer>
			<MkSpacer :contentMax="700">
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
			</MkSpacer>
		</template>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { ref, shallowRef, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue';
import * as Misskey from 'misskey-js';
import { isBottomVisible } from '@@/js/scroll.js';
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

const $i = ensureSignin();

const props = defineProps<{
	userId?: string;
	roomId?: string;
}>();

const rootEl = shallowRef<HTMLDivElement>();
const pagingComponent = shallowRef<InstanceType<typeof MkPagination>>();

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
			pageEl: rootEl.value,
		};
		connection.value = useStream().useChannel('chat', {
			other: user.value.id,
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
			pageEl: $$(rootEl).value,
		};
		connection = useStream().useChannel('chat', {
			room: room?.id,
		});
	}*/

	connection.value.on('message', onMessage);
	connection.value.on('deleted', onDeleted);

	document.addEventListener('visibilitychange', onVisibilitychange);

	fetching.value = false;
}

function onMessage(message) {
	//sound.play('chat');

	const _isBottom = isBottomVisible(rootEl, 64);

	pagingComponent.value.prepend(message);
	if (message.userId !== $i.id && !document.hidden) {
		connection.value?.send('read', {
			id: message.id,
		});
	}

	if (_isBottom) {
		// Scroll to bottom
		nextTick(() => {
			thisScrollToBottom();
		});
	} else if (message.userId !== $i.id) {
		// Notify
		notifyNewMessage();
	}
}

function onDeleted(id) {
	const msg = pagingComponent.value.items.find(m => m.id === id);
	if (msg) {
		pagingComponent.value.items = pagingComponent.value.items.filter(m => m.id !== msg.id);
	}
}

function thisScrollToBottom() {
	scrollToBottom(rootEl.value, { behavior: 'smooth' });
}

function onIndicatorClick() {
	showIndicator.value = false;
	thisScrollToBottom();
}

function notifyNewMessage() {
	showIndicator.value = true;

	scrollRemove.value = onScrollBottom(rootEl, () => {
		showIndicator.value = false;
		scrollRemove.value = null;
	});
}

function onVisibilitychange() {
	if (document.hidden) return;
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
	document.removeEventListener('visibilitychange', onVisibilitychange);
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
.root {
	display: content;
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

.messages {
	padding: 16px 0 0;
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

.form {
	max-height: 12em;
	overflow-y: scroll;
	border-top: solid 0.5px var(--divider);
	border-bottom-left-radius: 0;
	border-bottom-right-radius: 0;
}

.fade-enter-active, .fade-leave-active {
	transition: opacity 0.1s;
}

.fade-enter-from, .fade-leave-to {
	transition: opacity 0.5s;
	opacity: 0;
}
</style>
