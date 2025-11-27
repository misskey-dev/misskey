<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 1200px;">
	<MkLoading v-if="loading"/>
	<div v-else class="_gaps_m">
		<MkFoldableSection>
			<template #header>{{ i18n.ts._role.manual + " " + i18n.ts.roles }}</template>
			<div v-if="rolesManual && rolesManual.length > 0" :class="$style.roleGrid">
				<MkRolePreview v-for="role in rolesManual" :key="role.id" :role="role" :forModeration="false"/>
			</div>
			<MkResult v-else type="empty" :text="i18n.ts.noRole"/>
		</MkFoldableSection>
		<MkFoldableSection>
			<template #header>{{ i18n.ts._role.conditional + " " + i18n.ts.roles }}</template>
			<div v-if="rolesConditional && rolesConditional.length > 0" :class="$style.roleGrid">
				<MkRolePreview v-for="role in rolesConditional" :key="role.id" :role="role" :forModeration="false"/>
			</div>
			<MkResult v-else type="empty" :text="i18n.ts.noRole"/>
		</MkFoldableSection>
		<MkFoldableSection>
			<template #header>{{ i18n.ts.community + " " + i18n.ts.roles }}</template>
			<div v-if="rolesCommunity && rolesCommunity.length > 0" :class="$style.roleGrid">
				<MkRolePreview v-for="role in rolesCommunity" :key="role.id" :role="role" :forModeration="false"/>
			</div>
			<MkResult v-else type="empty" :text="i18n.ts.noRole"/>
		</MkFoldableSection>
		<!-- 権限がある場合のみ表示 -->
		<MkButton v-if="canEditCommunityRoles" primary rounded @click="createRole">
			<i class="ti ti-plus"></i> {{ i18n.ts._role.new }}
		</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, defineAsyncComponent } from 'vue';
import type { RolePolicies } from 'misskey-js/autogen/models.js';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import MkRolePreview from '@/components/MkRolePreview.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

type RoleWithCommunity = Misskey.entities.Role & { isCommunity?: boolean };

const loading = ref(true);
const rolesManual = ref<Misskey.entities.Role[] | null>(null);
const rolesConditional = ref<Misskey.entities.Role[] | null>(null);
const rolesCommunity = ref<Misskey.entities.Role[] | null>(null);
const canEditCommunityRoles = computed(() => {
	return $i && ($i.policies as RolePolicies & Record<string, unknown>).canEditCommunityRoles;
});

misskeyApi('roles/list').then(res => {
	const roles = (res as RoleWithCommunity[]).sort((a, b) => b.displayOrder - a.displayOrder);
	rolesManual.value = roles.filter(x => x.target === 'manual' && !x.isCommunity);
	rolesConditional.value = roles.filter(x => x.target === 'conditional' && !x.isCommunity);
	rolesCommunity.value = roles.filter(x => x.isCommunity);
	loading.value = false;
});

function createRole() {
	// 権限チェック - 編集権限がない場合は実行しない
	if (!canEditCommunityRoles.value) {
		os.alert({
			type: 'error',
			title: i18n.ts.error,
			text: i18n.ts.operationForbidden,
		});
		return;
	}

	// 権限がある場合のみダイアログを表示
	os.popup(defineAsyncComponent(() => import('./role-add-dialog.vue')), {}, {
		closed: () => {},
	});
}
</script>

<style lang="scss" module>
.roleGrid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	gap: var(--MI-margin);
}
</style>
