<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInput v-if="readonly" :modelValue="role.id" :readonly="true">
		<template #label>ID</template>
	</MkInput>

	<MkInput v-model="role.name" :readonly="readonly">
		<template #label>{{ i18n.ts._role.name }}</template>
	</MkInput>

	<MkTextarea v-model="role.description" :readonly="readonly">
		<template #label>{{ i18n.ts._role.description }}</template>
	</MkTextarea>

	<MkColorInput v-model="role.color">
		<template #label>{{ i18n.ts.color }}</template>
	</MkColorInput>

	<MkInput v-model="role.iconUrl" type="url">
		<template #label>{{ i18n.ts._role.iconUrl }}</template>
	</MkInput>

	<MkInput v-model="role.displayOrder" type="number">
		<template #label>{{ i18n.ts._role.displayOrder }}</template>
		<template #caption>{{ i18n.ts._role.descriptionOfDisplayOrder }}</template>
	</MkInput>

	<MkSelect v-model="rolePermission" :items="rolePermissionDef" :readonly="readonly">
		<template #label><i class="ti ti-shield-lock"></i> {{ i18n.ts._role.permission }}</template>
		<template #caption><div v-html="i18n.ts._role.descriptionOfPermission.replaceAll('\n', '<br>')"></div></template>
	</MkSelect>

	<MkSelect v-model="role.target" :items="[{ label: i18n.ts._role.manual, value: 'manual' }, { label: i18n.ts._role.conditional, value: 'conditional' }]" :readonly="readonly">
		<template #label><i class="ti ti-users"></i> {{ i18n.ts._role.assignTarget }}</template>
		<template #caption><div v-html="i18n.ts._role.descriptionOfAssignTarget.replaceAll('\n', '<br>')"></div></template>
	</MkSelect>

	<MkFolder v-if="role.target === 'conditional'" defaultOpen>
		<template #label>{{ i18n.ts._role.condition }}</template>
		<div class="_gaps">
			<RolesEditorFormula v-model="role.condFormula"/>
		</div>
	</MkFolder>

	<MkSwitch v-model="role.preserveAssignmentOnMoveAccount" :readonly="readonly">
		<template #label>{{ i18n.ts._role.preserveAssignmentOnMoveAccount }}</template>
		<template #caption>{{ i18n.ts._role.preserveAssignmentOnMoveAccount_description }}</template>
	</MkSwitch>

	<MkSwitch v-model="role.canEditMembersByModerator" :readonly="readonly">
		<template #label>{{ i18n.ts._role.canEditMembersByModerator }}</template>
		<template #caption>{{ i18n.ts._role.descriptionOfCanEditMembersByModerator }}</template>
	</MkSwitch>

	<MkSwitch v-model="role.isPublic" :readonly="readonly">
		<template #label>{{ i18n.ts._role.isPublic }}</template>
		<template #caption>{{ i18n.ts._role.descriptionOfIsPublic }}</template>
	</MkSwitch>

	<MkSwitch v-model="role.asBadge" :readonly="readonly">
		<template #label>{{ i18n.ts._role.asBadge }}</template>
		<template #caption>{{ i18n.ts._role.descriptionOfAsBadge }}</template>
	</MkSwitch>

	<MkSwitch v-model="role.isExplorable" :readonly="readonly">
		<template #label>{{ i18n.ts._role.isExplorable }}</template>
		<template #caption>{{ i18n.ts._role.descriptionOfIsExplorable }}</template>
	</MkSwitch>

	<FormSlot>
		<template #label><i class="ti ti-license"></i> {{ i18n.ts._role.policies }}</template>

		<XPolicyEditor
			v-model="role.policies"
			:withUseDefault="true"
			:withPriority="true"
			:readonly="readonly"
		/>
	</FormSlot>
</div>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { watch, ref, computed } from 'vue';
import { throttle } from 'throttle-debounce';
import RolesEditorFormula from './RolesEditorFormula.vue';
import XPolicyEditor from './roles.policy-editor.vue';
import type { MkSelectItem, GetMkSelectValueTypesFromDef } from '@/components/MkSelect.vue';
import MkInput from '@/components/MkInput.vue';
import MkColorInput from '@/components/MkColorInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSlot from '@/components/form/slot.vue';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { deepClone } from '@/utility/clone.js';
import type { RolePolicySettingsRecord } from '@/utility/role-policy.js';

const emit = defineEmits<{
	(ev: 'update:modelValue', v: any): void;
}>();

const props = defineProps<{
	modelValue: any;
	readonly?: boolean;
}>();

const role = ref<Misskey.entities.AdminRolesShowResponse & {
	policies: RolePolicySettingsRecord;
}>((() => {
	const roleBase = deepClone(props.modelValue);

	// fill missing policy
	for (const ROLE_POLICY of Misskey.rolePolicies) {
		if (roleBase.policies[ROLE_POLICY] == null) {
			roleBase.policies[ROLE_POLICY] = {
				useDefault: true,
				priority: 0,
				value: instance.policies[ROLE_POLICY],
			};
		}
	}

	return roleBase;
})());

const rolePermissionDef = [
	{ label: i18n.ts.normalUser, value: 'normal' },
	{ label: i18n.ts.moderator, value: 'moderator' },
	{ label: i18n.ts.administrator, value: 'administrator' },
] as const satisfies MkSelectItem[];

const rolePermission = computed<GetMkSelectValueTypesFromDef<typeof rolePermissionDef>>({
	get: () => role.value.isAdministrator ? 'administrator' : role.value.isModerator ? 'moderator' : 'normal',
	set: (val) => {
		role.value.isAdministrator = (val === 'administrator');
		role.value.isModerator = (val === 'moderator');
	},
});

const q = ref('');

const save = throttle(100, () => {
	const data = {
		name: role.value.name,
		description: role.value.description,
		color: role.value.color === '' ? null : role.value.color,
		iconUrl: role.value.iconUrl === '' ? null : role.value.iconUrl,
		displayOrder: role.value.displayOrder,
		target: role.value.target,
		condFormula: role.value.condFormula,
		isAdministrator: role.value.isAdministrator,
		isModerator: role.value.isModerator,
		isPublic: role.value.isPublic,
		isExplorable: role.value.isExplorable,
		asBadge: role.value.asBadge,
		canEditMembersByModerator: role.value.canEditMembersByModerator,
		policies: role.value.policies,
	};

	emit('update:modelValue', data);
});

watch(role, save, { deep: true });
</script>

<style lang="scss" module>
.useDefaultLabel {
	opacity: 0.7;
}

.priorityIndicator {
	margin-left: 8px;
}
</style>
