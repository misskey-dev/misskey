<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<div class="_gaps">
			<MkButton primary :class="$style.start" @click="start"><i class="ti ti-plus"></i> {{ i18n.ts.startChat }}</MkButton>

			<div v-if="history.length > 0" :class="$style.history">
				<MkA
					v-for="item in history"
					:key="item.id"
					:class="[$style.message, { [$style.isMe]: item.isMe, [$style.isRead]: item.message.isRead }]"
					class="_panel"
					:to="item.message.toRoomId ? `/chat/room/${item.message.toRoomId}` : `/chat/user/${item.other!.id}`"
				>
					<MkAvatar v-if="item.other" :class="$style.avatar" :user="item.other" indicator link preview/>
					<header v-if="item.message.room">
						<span :class="$style.name">{{ item.message.room.name }}</span>
						<MkTime :time="item.message.createdAt" :class="$style.time"/>
					</header>
					<header v-else>
						<MkUserName :class="$style.name" :user="item.other!"/>
						<MkAcct :class="$style.username" :user="item.other!"/>
						<MkTime :time="item.message.createdAt" :class="$style.time"/>
					</header>
					<div :class="$style.body">
						<p :class="$style.text"><span v-if="item.isMe" :class="$style.iSaid">{{ i18n.ts.you }}:</span>{{ item.message.text }}</p>
					</div>
				</MkA>
			</div>
			<div v-if="!fetching && history.length == 0" class="_fullinfo">
				<div>{{ i18n.ts.noHistory }}</div>
			</div>
			<MkLoading v-if="fetching"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { ensureSignin } from '@/i.js';
import { useRouter } from '@/router/supplier.js';
import * as os from '@/os.js';

const $i = ensureSignin();

const router = useRouter();

const fetching = ref(true);
const history = ref<{
	id: string;
	message: Misskey.entities.ChatMessage;
	other: Misskey.entities.ChatMessage['fromUser'] | Misskey.entities.ChatMessage['toUser'] | null;
	isMe: boolean;
}[]>([]);

function start(ev: MouseEvent) {
	os.popupMenu([{
		text: i18n.ts.individualChat,
		caption: i18n.ts.individualChat_description,
		icon: 'ti ti-user',
		action: () => { startUser(); },
	}, {
		text: i18n.ts.roomChat,
		caption: i18n.ts.roomChat_description,
		icon: 'ti ti-users',
		action: () => { startRoom(); },
	}], ev.currentTarget ?? ev.target);
}

async function startUser() {
	os.selectUser().then(user => {
		router.push(`/chat/user/${user.id}`);
	});
}

async function startRoom() {
	/*
	const rooms1 = await os.api('users/rooms/owned');
	const rooms2 = await os.api('users/rooms/joined');
	if (rooms1.length === 0 && rooms2.length === 0) {
		os.alert({
			type: 'warning',
			title: i18n.ts.youHaveNoGroups,
			text: i18n.ts.joinOrCreateGroup,
		});
		return;
	}
	const { canceled, result: room } = await os.select({
		title: i18n.ts.room,
		items: rooms1.concat(rooms2).map(room => ({
			value: room, text: room.name,
		})),
	});
	if (canceled) return;
	router.push(`/chat/room/${room.id}`);
	*/
}

async function fetchHistory() {
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
			other: m.room == null ? (m.fromUserId === $i.id ? m.toUser : m.fromUser) : null,
			isMe: m.fromUserId === $i.id,
		}));

	fetching.value = false;
}

onMounted(() => {
	fetchHistory();
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.chat,
	icon: 'ti ti-message',
}));
</script>

<style lang="scss" module>
.start {
	margin: 0 auto;
}
</style>
