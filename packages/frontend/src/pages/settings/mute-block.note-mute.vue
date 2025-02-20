<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination :pagination="blockingPagination">
	<template #empty>
		<div class="_fullinfo">
			<img :src="infoImageUrl" class="_ghost"/>
			<div>{{ i18n.ts.nothing }}</div>
		</div>
	</template>

	<template #default="{ items }">
		<div class="_gaps_s">
			<div v-for="item in items" :key="item.blockee.id" :class="[$style.userItem, { [$style.userItemOpend]: expandedBlockItems.includes(item.id) }]">
				<div :class="$style.userItemMain">
					<MkA :class="$style.userItemMainBody" :to="userPage(item.blockee)">
						<MkUserCardMini :user="item.blockee"/>
					</MkA>
					<button class="_button" :class="$style.userToggle" @click="toggleBlockItem(item)"><i :class="$style.chevron" class="ti ti-chevron-down"></i></button>
					<button class="_button" :class="$style.remove" @click="unblock(item.blockee, $event)"><i class="ti ti-x"></i></button>
				</div>
				<div v-if="expandedBlockItems.includes(item.id)" :class="$style.userItemSub">
					<div>Blocked at: <MkTime :time="item.createdAt" mode="detail"/></div>
					<div v-if="item.expiresAt">Period: {{ new Date(item.expiresAt).toLocaleString() }}</div>
					<div v-else>Period: {{ i18n.ts.indefinitely }}</div>
				</div>
			</div>
		</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>

import MkPagination from '@/components/MkPagination.vue';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import { userPage } from '@/filters/user';
import { i18n } from '@/i18n';
import { infoImageUrl } from '@/instance';

const noteMutingPagination = {
	endpoint: 'notes/muting/list' as const,
	limit: 10,
};
</script>
