<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div style="word-break: auto-phrase; text-align: center;">{{ i18n.ts._initialTutorial._followUsers.description1 }}<br>{{ i18n.ts._initialTutorial._followUsers.description2 }}</div>

	<MkFolder :defaultOpen="true">
		<template #label>{{ i18n.ts.recommended }}</template>

		<MkPagination :pagination="pinnedUsers">
			<template #default="{ items }">
				<div class="_gaps_s">
					<XUser v-for="item in (items as Misskey.entities.UserDetailed[])" :key="item.id" :user="item"/>
				</div>
			</template>
		</MkPagination>
	</MkFolder>

	<MkFolder :defaultOpen="true">
		<template #label>{{ i18n.ts.popularUsers }}</template>

		<MkPagination :pagination="popularUsers">
			<template #default="{ items }">
				<div class="_gaps_s">
					<XUser v-for="item in (items as Misskey.entities.UserDetailed[])" :key="item.id" :user="item"/>
				</div>
			</template>
		</MkPagination>
	</MkFolder>
</div>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import MkFolder from '@/components/MkFolder.vue';
import XUser from '@/components/MkTutorial.FollowUsers.UserCard.vue';
import MkPagination, { type Paging } from '@/components/MkPagination.vue';

const pinnedUsers: Paging = {
	endpoint: 'pinned-users',
	noPaging: true,
	limit: 10,
};

const popularUsers: Paging = {
	endpoint: 'users',
	limit: 10,
	noPaging: true,
	params: {
		state: 'alive',
		origin: 'local',
		sort: '+follower',
	},
};
</script>
