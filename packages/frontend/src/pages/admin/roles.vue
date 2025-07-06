<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps">
			<MkFolder>
				<template #label>{{ i18n.ts._role.baseRole }}</template>
				<template #footer>
					<MkButton primary rounded @click="updateBaseRole">{{ i18n.ts.save }}</MkButton>
				</template>

				<XPolicyEditor
					v-model="policies"
					:withUseDefault="false"
					:withPriority="false"
				/>
			</MkFolder>
			<MkButton primary rounded @click="create"><i class="ti ti-plus"></i> {{ i18n.ts._role.new }}</MkButton>
			<div class="_gaps_s">
				<MkFoldableSection>
					<template #header>{{ i18n.ts._role.manualRoles }}</template>
					<div class="_gaps_s">
						<MkRolePreview v-for="role in roles.filter(x => x.target === 'manual')" :key="role.id" :role="role" :forModeration="true"/>
					</div>
				</MkFoldableSection>
				<MkFoldableSection>
					<template #header>{{ i18n.ts._role.conditionalRoles }}</template>
					<div class="_gaps_s">
						<MkRolePreview v-for="role in roles.filter(x => x.target === 'conditional')" :key="role.id" :role="role" :forModeration="true"/>
					</div>
				</MkFoldableSection>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { RolePolicyRecord, RolePolicyValueRecord } from './roles.policy-editor.def.js';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import XPolicyEditor from './roles.policy-editor.vue';
import MkRolePreview from '@/components/MkRolePreview.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { instance, fetchInstance } from '@/instance.js';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { useRouter } from '@/router.js';
import { deepClone } from '@/utility/clone.js';

const router = useRouter();

const roles = await misskeyApi('admin/roles/list');

const policies = ref<RolePolicyValueRecord>((() => {
	const _p = deepClone(instance.policies);

	return Object.fromEntries(
		Object.entries(_p).map(([key, value]) => {
			return [key, { value }];
		})
	) as RolePolicyValueRecord;
})());

async function updateBaseRole() {
	const _policies = Object.fromEntries(
		Object.entries(policies.value).map(([key, value]) => {
			return [key, value.value];
		})
	) as RolePolicyRecord;

	await os.apiWithDialog('admin/roles/update-default-policies', {
		policies: _policies,
	});
	fetchInstance(true);
}

function create() {
	router.push('/admin/roles/new');
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.roles,
	icon: 'ti ti-badges',
}));
</script>

<style lang="scss" module>

</style>
