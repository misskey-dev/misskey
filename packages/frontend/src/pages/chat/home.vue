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

			<div v-if="messages.length > 0" :class="$style.history">
				<MkA
					v-for="(message, i) in messages"
					:key="message.id"
					:class="[$style.message, { [$style.isMe]: message.isMe, [$style.isRead]: message.isRead }]"
					class="_panel"
					:to="message.roomId ? `/chat/room/${message.roomId}` : `/chat/user/${message.otherId}`"
				>
					<div>
						<MkAvatar :class="$style.avatar" :user="message.user" indicator link preview/>
						<header v-if="message.roomId">
							<span class="name">{{ message.room.name }}</span>
							<MkTime :time="message.createdAt" class="time"/>
						</header>
						<header v-else>
							<span class="name"><MkUserName :user="message.other"/></span>
							<span class="username">@{{ acct(message.other) }}</span>
							<MkTime :time="message.createdAt" class="time"/>
						</header>
						<div class="body">
							<p class="text"><span v-if="message.isMe" :class="$style.iSaid">{{ i18n.ts.you }}:</span>{{ message.text }}</p>
						</div>
					</div>
				</MkA>
			</div>
			<div v-if="!fetching && messages.length == 0" class="_fullinfo">
				<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
				<div>{{ $ts.noHistory }}</div>
			</div>
			<MkLoading v-if="fetching"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { infoImageUrl } from '@/instance.js';

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
