<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div :class="$style.header">
		<MkSelect v-model="type" :items="typeDef" :class="$style.typeSelect">
		</MkSelect>
		<button v-if="draggable" class="drag-handle _button" :class="$style.dragHandle">
			<i class="ti ti-menu-2"></i>
		</button>
		<button v-if="draggable" class="_button" :class="$style.remove" @click="removeSelf">
			<i class="ti ti-x"></i>
		</button>
	</div>

	<div v-if="type === 'and' || type === 'or'" class="_gaps">
		<div ref="dndParentEl" class="_gaps">
			<div v-for="valueId in valueIds" :key="valueId" :class="$style.item">
				<RolesEditorFormula :modelValue="valueKv[valueId]" draggable @update:modelValue="valuesItemUpdated" @remove="removeItem(valueId)"/>
			</div>
		</div>
		<MkButton rounded style="margin: 0 auto;" @click="addValue"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
	</div>

	<div v-else-if="assertValueNot(v)" :class="$style.item">
		<RolesEditorFormula v-model="v.value"/>
	</div>

	<MkInput v-else-if="['createdMoreThan', 'createdLessThan'].includes(type) && 'sec' in v" v-model="v.sec" type="number">
		<template #suffix>sec</template>
	</MkInput>

	<MkInput v-else-if="['followersLessThanOrEq', 'followersMoreThanOrEq', 'followingLessThanOrEq', 'followingMoreThanOrEq', 'notesLessThanOrEq', 'notesMoreThanOrEq'].includes(type) && 'value' in v" v-model="v.value" type="number">
	</MkInput>

	<MkSelect v-else-if="type === 'roleAssignedTo'" v-model="v.roleId" :items="assignedToDef">
	</MkSelect>
</div>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef, ref, watch } from 'vue';
import { genId } from '@/utility/id.js';
import { animations } from '@formkit/drag-and-drop';
import { dragAndDrop } from '@formkit/drag-and-drop/vue';
import * as Misskey from 'misskey-js';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import type { GetMkSelectValueTypesFromDef, MkSelectItem } from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { deepClone } from '@/utility/clone.js';
import { rolesCache } from '@/cache.js';

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.RoleCondFormulaValue): void;
	(ev: 'remove'): void;
}>();

const props = defineProps<{
	modelValue: Misskey.entities.RoleCondFormulaValue;
	draggable?: boolean;
}>();

function assertLogicFormula(f: Misskey.entities.RoleCondFormulaValue): f is Misskey.entities.RoleCondFormulaLogics {
	return ['and', 'or'].includes(f.type);
}

function assertValueNot(f: Misskey.entities.RoleCondFormulaValue): f is Misskey.entities.RoleCondFormulaValueNot {
	return f.type === 'not';
}

const dndParentEl = useTemplateRef('dndParentEl');
const v = ref(deepClone(props.modelValue));

const valueKv = computed(() => {
	if (assertLogicFormula(v.value)) {
		return Object.fromEntries(v.value.values.map(v => [v.id, v] as const));
	} else {
		return [];
	}
});

function updateValueIds(to: Misskey.entities.RoleCondFormulaValue) {
	if (assertLogicFormula(to)) {
		return to.values.map(v => v.id);
	} else {
		return [];
	}
}

const valueIds = ref(updateValueIds(v.value));

watch(v, () => {
	valueIds.value = updateValueIds(v.value);
}, { deep: true });

dragAndDrop({
	parent: dndParentEl,
	values: valueIds,
	// TODO: v0.2.0時点では親子階層のドラッグアンドドロップは不安定
	//group: 'roleFormula',
	dragHandle: '.drag-handle',
	plugins: [animations()],
	onDragend: () => {
		if (assertLogicFormula(v.value)) {
			v.value.values = valueIds.value.map(id => {
				if (assertLogicFormula(v.value)) {
					return v.value.values.find(v => v.id === id) ?? null;
				} else {
					return null;
				}
			}).filter(v => v !== null);
		}
	},
});

const roles = await rolesCache.fetch();

watch(() => props.modelValue, () => {
	if (JSON.stringify(props.modelValue) === JSON.stringify(v.value)) return;
	v.value = deepClone(props.modelValue);
}, { deep: true });

watch(v, () => {
	emit('update:modelValue', v.value);
}, { deep: true });

const typeDef = [
	{ label: i18n.ts._role._condition.isLocal, value: 'isLocal' },
	{ label: i18n.ts._role._condition.isRemote, value: 'isRemote' },
	{ label: i18n.ts._role._condition.isSuspended, value: 'isSuspended' },
	{ label: i18n.ts._role._condition.isLocked, value: 'isLocked' },
	{ label: i18n.ts._role._condition.isBot, value: 'isBot' },
	{ label: i18n.ts._role._condition.isCat, value: 'isCat' },
	{ label: i18n.ts._role._condition.isExplorable, value: 'isExplorable' },
	{ label: i18n.ts._role._condition.roleAssignedTo, value: 'roleAssignedTo' },
	{ label: i18n.ts._role._condition.createdLessThan, value: 'createdLessThan' },
	{ label: i18n.ts._role._condition.createdMoreThan, value: 'createdMoreThan' },
	{ label: i18n.ts._role._condition.followersLessThanOrEq, value: 'followersLessThanOrEq' },
	{ label: i18n.ts._role._condition.followersMoreThanOrEq, value: 'followersMoreThanOrEq' },
	{ label: i18n.ts._role._condition.followingLessThanOrEq, value: 'followingLessThanOrEq' },
	{ label: i18n.ts._role._condition.followingMoreThanOrEq, value: 'followingMoreThanOrEq' },
	{ label: i18n.ts._role._condition.notesLessThanOrEq, value: 'notesLessThanOrEq' },
	{ label: i18n.ts._role._condition.notesMoreThanOrEq, value: 'notesMoreThanOrEq' },
	{ label: i18n.ts._role._condition.and, value: 'and' },
	{ label: i18n.ts._role._condition.or, value: 'or' },
	{ label: i18n.ts._role._condition.not, value: 'not' },
] as const satisfies MkSelectItem[];

const type = computed<GetMkSelectValueTypesFromDef<typeof typeDef>>({
	get: () => v.value.type,
	set: (t) => {
		v.value.type = t;

		if (v.value.type === 'and') v.value.values = [];
		if (v.value.type === 'or') v.value.values = [];
		if (v.value.type === 'not') v.value.value = { id: genId(), type: 'isRemote' };
		if (v.value.type === 'roleAssignedTo') v.value.roleId = '';
		if (v.value.type === 'createdLessThan') v.value.sec = 86400;
		if (v.value.type === 'createdMoreThan') v.value.sec = 86400;
		if (v.value.type === 'followersLessThanOrEq') v.value.value = 10;
		if (v.value.type === 'followersMoreThanOrEq') v.value.value = 10;
		if (v.value.type === 'followingLessThanOrEq') v.value.value = 10;
		if (v.value.type === 'followingMoreThanOrEq') v.value.value = 10;
		if (v.value.type === 'notesLessThanOrEq') v.value.value = 10;
		if (v.value.type === 'notesMoreThanOrEq') v.value.value = 10;
	},
});

const assignedToDef = computed(() => roles.filter(r => r.target === 'manual').map(r => ({ label: r.name, value: r.id })) satisfies MkSelectItem[]);

function addValue() {
	if (!assertLogicFormula(v.value)) return;
	v.value.values.push({ id: genId(), type: 'isRemote' });
}

function valuesItemUpdated(item: Misskey.entities.RoleCondFormulaValue) {
	if (!assertLogicFormula(v.value)) return;
	const i = v.value.values.findIndex(_item => _item.id === item.id);
	v.value.values[i] = item;
}

function removeItem(itemId: string) {
	if (!assertLogicFormula(v.value)) return;
	v.value.values = v.value.values.filter(_item => _item.id !== itemId);
}

function removeSelf() {
	emit('remove');
}
</script>

<style lang="scss" module>
.header {
	display: flex;
}

.typeSelect {
	flex: 1;
}

.dragHandle {
	cursor: move;
	margin-left: 10px;
}

.remove {
	margin-left: 10px;
}

.item {
	border: solid 2px var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	padding: 12px;

	&:hover {
		border-color: var(--MI_THEME-accent);
	}
}
</style>
