<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInput v-if="readonly && role.id != null" :modelValue="role.id" :readonly="true">
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
		<div class="_gaps_s">
			<MkInput v-model="q" type="search">
				<template #prefix><i class="ti ti-search"></i></template>
			</MkInput>

			<XPolicyEditor
				v-model:rolePolicies="rolePolicyValues"
				v-model:policiesMeta="rolePolicyMeta"
				:isBaseRole="false"
				:roleQuery="q"
				:readonly="readonly"
			/>
		</div>
	</FormSlot>
</div>
</template>

<script lang="ts" setup>
import { watch, ref, computed } from 'vue';
import { throttle } from 'throttle-debounce';
import * as Misskey from 'misskey-js';
import RolesEditorFormula from './RolesEditorFormula.vue';
import type { MkSelectItem, GetMkSelectValueTypesFromDef } from '@/components/MkSelect.vue';
import MkInput from '@/components/MkInput.vue';
import MkColorInput from '@/components/MkColorInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSlot from '@/components/form/slot.vue';
import XPolicyEditor from './roles.policy-editor.vue';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { deepClone } from '@/utility/clone.js';
import type { PolicyMeta } from './roles.policy-editor.vue';

type RoleLike = Pick<Misskey.entities.Role, 'name' | 'description' | 'isAdministrator' | 'isModerator' | 'color' | 'iconUrl' | 'target' | 'isPublic' | 'isExplorable' | 'asBadge' | 'canEditMembersByModerator' | 'displayOrder' | 'preserveAssignmentOnMoveAccount'> & {
	id?: Misskey.entities.Role['id'] | null;
	condFormula: any;
	policies: any;
};

const emit = defineEmits<{
	(ev: 'update:modelValue', v: RoleLike): void;
}>();

const props = defineProps<{
	modelValue: RoleLike;
	readonly?: boolean;
}>();

const role = ref((() => {
	const base = deepClone(props.modelValue);
	// fill missing policy
	for (const ROLE_POLICY of Misskey.rolePolicies) {
		if (base.policies[ROLE_POLICY] == null) {
			base.policies[ROLE_POLICY] = {
				useDefault: true,
				priority: 0,
				value: instance.policies[ROLE_POLICY],
			};
		}
	}
	return base;
})());
const rolePolicyValues = computed<any>({
	get: () => {
		return Object.fromEntries(
			Object.entries(role.value.policies).map(([k, v]) => [k, (v as { value: unknown }).value]),
		);
	},
	set: (v) => {
		for (const [k, val] of Object.entries(v)) {
			if (role.value.policies[k] != null) {
				role.value.policies[k].value = val;
			}
		}
	},
});
const rolePolicyMeta = computed<any>({
	get: () => {
		return Object.fromEntries(
			Object.entries(role.value.policies).map(([k, v]) => [k, {
				useDefault: (v as PolicyMeta).useDefault,
				priority: (v as PolicyMeta).priority,
			}]),
		);
	},
	set: (v: Record<string, PolicyMeta>) => {
		for (const [k, val] of Object.entries(v)) {
			if (role.value.policies[k] != null) {
				role.value.policies[k].useDefault = val.useDefault;
				role.value.policies[k].priority = val.priority;
			}
		}
	},
});

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
		preserveAssignmentOnMoveAccount: role.value.preserveAssignmentOnMoveAccount,
		policies: role.value.policies,
	};

	emit('update:modelValue', data);
});

watch(role, save, { deep: true });
</script>
