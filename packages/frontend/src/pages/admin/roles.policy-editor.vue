<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_s">
	<MkInput v-if="withSearchBar" v-model="searchQuery" type="search">
		<template #prefix><i class="ti ti-search"></i></template>
	</MkInput>

	<MkFolder v-for="(def, key) in filteredDefs" :key="key">
		<template #label>{{ def.displayLabel }}</template>
		<template #suffix>
			<span v-if="withUseDefault && model[key].useDefault">{{ i18n.ts._role.useBaseValue }}</span>
			<span v-else>{{ getPolicyDisplayValue(def, model[key].value) }}</span>
			<span v-if="withPriority" :class="$style.priorityIndicator"><i :class="getPriorityIcon(model[key].priority)"></i></span>
		</template>

		<div class="_gaps">
			<MkSwitch v-if="withUseDefault" v-model="model[key].useDefault" :disabled="readonly">
				<template #label>{{ i18n.ts._role.useBaseValue }}</template>
			</MkSwitch>

			<XForm
				v-model="model[key].value"
				:def="def"
				:disabled="withUseDefault && model[key].useDefault"
				:readonly="readonly"
			/>

			<MkRange
				v-if="withPriority"
				v-model="model[key].priority"
				:min="0"
				:max="2"
				:step="1"
				easing
				:textConverter="(v) => v === 0 ? i18n.ts._role._priority.low : v === 1 ? i18n.ts._role._priority.middle : v === 2 ? i18n.ts._role._priority.high : ''"
				:disabled="readonly || (withUseDefault && model[key].useDefault)"
			>
				<template #label>{{ i18n.ts._role.priority }}</template>
			</MkRange>
		</div>
	</MkFolder>
</div>
</template>

<script lang="ts" setup generic="WP extends boolean, UD extends boolean">
import { ref, computed } from 'vue';
import { i18n } from '@/i18n.js';
import MkInput from '@/components/MkInput.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import XForm from './roles.policy-editor.form.vue';
import { rolePolicyDef, getPolicyDisplayValue } from '@/utility/role-policy.js';
import type { GetRolePolicyEditorValuesType, RolePolicyDefItem } from '@/types/role-policy-editor.js';

const props = withDefaults(defineProps<{
	withUseDefault: UD;
	withPriority: WP;
	withSearchBar?: boolean;
	readonly?: boolean;
}>(), {
	withSearchBar: true,
	readonly: false,
});

type RemoveNever<T> = {
	[P in keyof T as T[P] extends never ? never : P]: T[P];
};

type RolePolicyEditorValueItem = {
	value: GetRolePolicyEditorValuesType<typeof rolePolicyDef[keyof typeof rolePolicyDef]>;
} & RemoveNever<
	(UD extends true ? { useDefault: boolean } : { useDefault: never })
	& (WP extends true ? { priority: 0 | 1 | 2 } : { priority: never })
>;

type RolePolicyEditorValue = {
	[K in keyof typeof rolePolicyDef]: RolePolicyEditorValueItem;
};

const model = defineModel<RolePolicyEditorValue>({ required: true });

const searchQuery = ref('');

function matchQuery(keywords: string[]) {
	if (searchQuery.value.trim().length === 0) return true;
	return keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.value.toLowerCase()));
}

const filteredDefs = computed(() => {
	if (!props.withSearchBar) return rolePolicyDef;

	return Object.fromEntries(
		Object.entries(rolePolicyDef).filter(([key, def]) => {
			if (searchQuery.value.trim().length === 0) return true;
			const matchTerms = [
				key,
				def.displayLabel,
				...((def as RolePolicyDefItem).searchTerms ? (def as RolePolicyDefItem).searchTerms ?? [] : []),
			];
			return matchQuery(matchTerms);
		}),
	);
});

function getPriorityIcon(priority: number) {
	if (priority === 2) return 'ti ti-arrows-up';
	if (priority === 1) return 'ti ti-arrow-narrow-up';
	return 'ti ti-point';
}
</script>

<style lang="scss" module>
.useDefaultLabel {
	opacity: 0.7;
}

.priorityIndicator {
	margin-left: 8px;
}
</style>
