<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 700px;">
	<div v-if="roles != null && roles.length > 0" class="_gaps_s">
		<MkRolePreview v-for="role in roles" :key="role.id" :role="role" :forModeration="false"/>
	</div>
	<MkLoading v-else-if="loading" />
	<MkResult v-else type="empty" :text="i18n.ts.noRole"/>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkRolePreview from '@/components/MkRolePreview.vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';

const roles = ref<Misskey.entities.Role[] | null>(null);
const loading = ref(true);

misskeyApi('roles/list').then(res => {
	roles.value = res.filter(x => x.target === 'manual').sort((a, b) => {
		// displayOrderを第一優先でソート
		if (a.displayOrder !== b.displayOrder) {
			return b.displayOrder - a.displayOrder;
		}
		// policies.canPublicNote: true (非違反ロール) を優先的に上に表示
		if (a.policies.canPublicNote.value !== b.policies.canPublicNote.value) {
			return a.policies.canPublicNote.value ? -1 : 1;
		}
		// 同じステータス内ではユーザー数順にソート
		return b.usersCount - a.usersCount;
	});
}).finally(() => {
	loading.value = false;
});
</script>

