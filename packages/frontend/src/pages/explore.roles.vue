<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
    <MkFoldableSection>
        <template #header>{{ i18n.ts._role.manual + " " + i18n.ts.roles }}</template>
        <div :class="$style.roleGrid">
            <MkRolePreview v-for="role in rolesManual" :key="role.id" :role="role" :forModeration="false"/>
        </div>
    </MkFoldableSection>
    <MkFoldableSection>
        <template #header>{{ i18n.ts._role.conditional + " " + i18n.ts.roles }}</template>
        <div :class="$style.roleGrid">
            <MkRolePreview v-for="role in rolesConditional" :key="role.id" :role="role" :forModeration="false"/>
        </div>
    </MkFoldableSection>
    <MkFoldableSection>
        <template #header>{{ i18n.ts.community + " " + i18n.ts.roles }}</template>
        <div :class="$style.roleGrid">
            <MkRolePreview v-for="role in rolesCommunity" :key="role.id" :role="role" :forModeration="false"/>
        </div>
    </MkFoldableSection>
    <!-- 権限がある場合のみ表示 -->
    <MkButton v-if="canAddRoles" primary rounded @click="createRole">
        <i class="ti ti-plus"></i> {{ i18n.ts._role.new }}
    </MkButton>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import MkRolePreview from '@/components/MkRolePreview.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

const rolesManual = ref<Misskey.entities.Role[] | null>(null);
const rolesConditional = ref<Misskey.entities.Role[] | null>(null);
const rolesCommunity = ref<Misskey.entities.Role[] | null>(null);
const canAddRoles = computed(() => {
	return $i && $i.policies.canAddRoles;
});

misskeyApi('roles/list').then(res => {
	const roles = res.sort((a, b) => b.displayOrder - a.displayOrder);
	rolesManual.value = roles.filter(x => x.target === 'manual' && x.permissionGroup !== 'Community');
	rolesConditional.value = roles.filter(x => x.target === 'conditional' && x.permissionGroup !== 'Community');
	rolesCommunity.value = roles.filter(x => x.permissionGroup === 'Community');
});

function createRole() {
	// 権限チェック - 権限がない場合は実行しない
	if (!canAddRoles.value) {
		os.alert({
			type: 'error',
			title: i18n.ts.error,
			text: i18n.ts.operationForbidden,
		});
		return;
	}

	// 権限がある場合のみダイアログを表示
	os.popup(defineAsyncComponent(() => import('./role-add-dialog.vue')), {}, {}, 'closed');
}
</script>

<style lang="scss" module>
	.roleGrid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		grid-gap: var(--margin);
	}
</style>

