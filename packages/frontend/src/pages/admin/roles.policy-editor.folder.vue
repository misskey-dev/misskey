<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<MkFolder>
		<template #label><slot name="label"></slot></template>
		<template #suffix>
			<template v-if="isBaseRole">
				<span><slot name="valueText"></slot></span>
			</template>
			<template v-else-if="rolePolicyMetaModel != null">
				<span v-if="rolePolicyMetaModel.useDefault" :class="$style.useDefaultLabel">{{ i18n.ts._role.useBaseValue }}</span>
				<span v-else><slot name="valueText"></slot></span>
				<span :class="$style.priorityIndicator"><i :class="getPriorityIcon(rolePolicyMetaModel.priority)"></i></span>
			</template>
		</template>
		<div class="_gaps">
			<MkSwitch v-if="!isBaseRole && rolePolicyMetaModel != null" v-model="rolePolicyMetaModel.useDefault" :disabled="readonly">
				<template #label>{{ i18n.ts._role.useBaseValue }}</template>
			</MkSwitch>
			<div>
				<slot :disabled="readonly || (!isBaseRole && rolePolicyMetaModel?.useDefault)"></slot>
			</div>
			<MkRange v-if="!isBaseRole && rolePolicyMetaModel != null" v-model="rolePolicyMetaModel.priority" :min="0" :max="2" :step="1" easing :textConverter="priroityRangeTextConverter" :disabled="readonly">
				<template #label>{{ i18n.ts._role.priority }}</template>
			</MkRange>
		</div>
	</MkFolder>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';
import { i18n } from '@/i18n.js';
import type { PolicyMeta } from './roles.policy-editor.vue';

const props = defineProps<{
	isBaseRole: boolean;
	policyMeta?: PolicyMeta | null;
	readonly?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'update:policyMeta', v: PolicyMeta): void;
}>();

const rolePolicyMetaModel = ref<PolicyMeta | null>(null);
watch(() => props.policyMeta, (v) => {
	if (v != null) {
		rolePolicyMetaModel.value = v;
	} else {
		rolePolicyMetaModel.value = null;
	}
}, { immediate: true, deep: true });
watch(rolePolicyMetaModel, (v) => {
	if (v != null) {
		emit('update:policyMeta', v);
	}
}, { deep: true });

function getPriorityIcon(priority: number): string {
	if (priority === 2) return 'ti ti-arrows-up';
	if (priority === 1) return 'ti ti-arrow-narrow-up';
	return 'ti ti-point';
}

function priroityRangeTextConverter(v: number): string {
	if (v === 0) return i18n.ts._role._priority.low;
	if (v === 1) return i18n.ts._role._priority.middle;
	if (v === 2) return i18n.ts._role._priority.high;
	return '';
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
