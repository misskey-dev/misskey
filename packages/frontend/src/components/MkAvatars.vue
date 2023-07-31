<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div v-for="user in users.slice(0, limit)" :key="user.id" style="display:inline-block;width:32px;height:32px;margin-right:8px;">
		<MkAvatar :user="user" style="width:32px; height:32px;" indicator link preview/>
	</div>
	<div v-if="users.length > limit" style="display: inline-block;">...</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as os from '@/os';
import { UserLite } from 'misskey-js/built/entities';

const props = withDefaults(defineProps<{
	userIds: string[];
	limit?: number;
}>(), {
	limit: Infinity,
});

const users = ref<UserLite[]>([]);

onMounted(async () => {
	users.value = await os.api('users/show', {
		userIds: props.userIds,
	}) as unknown as UserLite[];
});
</script>
