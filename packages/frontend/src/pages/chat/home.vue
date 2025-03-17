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
					:to="item.message.roomId ? `/chat/room/${item.message.roomId}` : `/chat/user/${item.other.id}`"
				>
					<div>
						<MkAvatar :class="$style.avatar" :user="item.other" indicator link preview/>
						<header v-if="item.message.roomId">
							<span class="name">{{ item.message.room.name }}</span>
							<MkTime :time="item.message.createdAt" class="time"/>
						</header>
						<header v-else>
							<span class="name"><MkUserName :user="item.other"/></span>
							<span class="username">@{{ acct(item.other) }}</span>
							<MkTime :time="item.message.createdAt" class="time"/>
						</header>
						<div class="body">
							<p class="text"><span v-if="item.isMe" :class="$style.iSaid">{{ i18n.ts.you }}:</span>{{ item.message.text }}</p>
						</div>
					</div>
				</MkA>
			</div>
			<div v-if="!fetching && history.length == 0" class="_fullinfo">
				<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
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
import { infoImageUrl } from '@/instance.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { ensureSignin } from '@/i.js';

const $i = ensureSignin();

const fetching = ref(true);
const history = ref<{
	id: string;
	message: Misskey.entities.ChatMessage;
	other: Misskey.entities.ChatMessage['fromUser'] | Misskey.entities.ChatMessage['toUser'] | null;
	isMe: boolean;
}[]>([]);

async function fetchHistory() {
	fetching.value = true;

	const [userMessages, groupMessages] = await Promise.all([
		misskeyApi('messaging/history', { group: false }),
		misskeyApi('messaging/history', { group: true }),
	]);

	history.value = [...userMessages, ...groupMessages]
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
.add {
	margin: 0 auto 16px auto;
}

.antenna {
	display: block;
	padding: 16px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 6px;

	&:hover {
		border: solid 1px var(--MI_THEME-accent);
		text-decoration: none;
	}
}

.name {
	font-weight: bold;
}
</style>
