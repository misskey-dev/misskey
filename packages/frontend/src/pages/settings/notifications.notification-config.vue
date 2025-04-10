<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSelect v-model="type">
		<option v-for="type in props.configurableTypes ?? notificationConfigTypes" :key="type" :value="type">{{ notificationConfigTypesI18nMap[type] }}</option>
	</MkSelect>

	<MkSelect v-if="type === 'list'" v-model="userListId">
		<template #label>{{ i18n.ts.userList }}</template>
		<option v-for="list in props.userLists" :key="list.id" :value="list.id">{{ list.name }}</option>
	</MkSelect>

	<div class="_buttons">
		<MkButton inline primary :disabled="type === 'list' && userListId === null" @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
	</div>
</div>
</template>

<script lang="ts">
const notificationConfigTypes = [
	'all',
	'following',
	'follower',
	'mutualFollow',
	'followingOrFollower',
	'list',
	'never'
] as const;

export type NotificationConfig = {
	type: Exclude<typeof notificationConfigTypes[number], 'list'>;
} | {
	type: 'list';
	userListId: string;
};
</script>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { ref } from 'vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	value: NotificationConfig;
	userLists: Misskey.entities.UserList[];
	configurableTypes?: NotificationConfig['type'][]; // If not specified, all types are configurable
}>();

const emit = defineEmits<{
	(ev: 'update', result: NotificationConfig): void;
}>();

const notificationConfigTypesI18nMap: Record<typeof notificationConfigTypes[number], string> = {
	all: i18n.ts.all,
	following: i18n.ts.following,
	follower: i18n.ts.followers,
	mutualFollow: i18n.ts.mutualFollow,
	followingOrFollower: i18n.ts.followingOrFollower,
	list: i18n.ts.userList,
	never: i18n.ts.none,
};

const type = ref(props.value.type);
const userListId = ref(props.value.type === 'list' ? props.value.userListId : null);

function save() {
	emit('update', type.value === 'list' ? { type: type.value, userListId: userListId.value! } : { type: type.value });
}
</script>
