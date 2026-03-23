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
		// 仕様: 1.違反ロール(Silence等)は常に下 2.付与人数が多い順 3.displayOrder順
		const aCanPublic = typeof a.policies.canPublicNote === 'boolean' ? a.policies.canPublicNote : (a.policies.canPublicNote as any)?.value ?? true;
		const bCanPublic = typeof b.policies.canPublicNote === 'boolean' ? b.policies.canPublicNote : (b.policies.canPublicNote as any)?.value ?? true;
		if (aCanPublic !== bCanPublic) {
			return aCanPublic ? -1 : 1;
		}
		// 同グループ内ではユーザー数（付与人数）が多い順
		if (a.usersCount !== b.usersCount) {
			return b.usersCount - a.usersCount;
		}
		// 同ユーザー数内ではdisplayOrder順
		return b.displayOrder - a.displayOrder;
	});
}).finally(() => {
	loading.value = false;
});
</script>

