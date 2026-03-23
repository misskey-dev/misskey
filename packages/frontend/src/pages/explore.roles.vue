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
		// 仕様: 違反ロール(Silence等)は常に下、非違反を第一優先でソート
		const aCanPublic = typeof a.policies.canPublicNote === 'boolean' ? a.policies.canPublicNote : (a.policies.canPublicNote as any)?.value ?? true;
		const bCanPublic = typeof b.policies.canPublicNote === 'boolean' ? b.policies.canPublicNote : (b.policies.canPublicNote as any)?.value ?? true;
		if (aCanPublic !== bCanPublic) {
			return aCanPublic ? -1 : 1;
		}
		// 同グループ内ではdisplayOrder順
		if (a.displayOrder !== b.displayOrder) {
			return b.displayOrder - a.displayOrder;
		}
		// 同displayOrder内ではユーザー数順
		return b.usersCount - a.usersCount;
	});
}).finally(() => {
	loading.value = false;
});
</script>

