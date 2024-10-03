<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSelect v-model="type">
		<option value="all">{{ i18n.ts.all }}</option>
		<option value="following">{{ i18n.ts.following }}</option>
		<option value="follower">{{ i18n.ts.followers }}</option>
		<option value="mutualFollow">{{ i18n.ts.mutualFollow }}</option>
		<option value="followingOrFollower">{{ i18n.ts.followingOrFollower }}</option>
		<option value="list">{{ i18n.ts.userList }}</option>
		<option value="never">{{ i18n.ts.none }}</option>
	</MkSelect>

	<MkSelect v-if="type === 'list'" v-model="userListId">
		<template #label>{{ i18n.ts.userList }}</template>
		<option v-for="list in props.userLists" :key="list.id" :value="list.id">{{ list.name }}</option>
	</MkSelect>

	<div class="_buttons">
		<MkButton inline primary @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	value: any;
	userLists: Misskey.entities.UserList[];
}>();

const emit = defineEmits<{
	(ev: 'update', result: any): void;
}>();

const type = ref(props.value.type);
const userListId = ref(props.value.userListId);

function save() {
	emit('update', { type: type.value, userListId: userListId.value });
}
</script>
