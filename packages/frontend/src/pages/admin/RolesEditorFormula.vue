<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div :class="$style.header">
		<MkSelect v-model="typeModelForMkSelect" :items="typeDef" :class="$style.typeSelect">
		</MkSelect>
		<button v-if="draggable" class="_button" :class="$style.dragHandle" :draggable="true" @dragstart.stop="dragStartCallback">
			<i class="ti ti-menu-2"></i>
		</button>
		<button v-if="draggable" class="_button" :class="$style.remove" @click="removeSelf">
			<i class="ti ti-x"></i>
		</button>
	</div>

	<div v-if="v.type === 'and' || v.type === 'or'" class="_gaps">
		<MkDraggable
			v-model="v.values"
			direction="vertical"
			withGaps
			canNest
			manualDragStart
			group="roleFormula"
		>
			<template #default="{ item, dragStart }">
				<div :class="$style.item">
					<!-- divが無いとエラーになる https://github.com/SortableJS/vue.draggable.next/issues/189 -->
					<RolesEditorFormula
						:modelValue="item"
						:dragStartCallback="dragStart"
						draggable
						@update:modelValue="updated => childValuesItemUpdated(updated)"
						@remove="removeChildItem(item.id)"
					/>
				</div>
			</template>
		</MkDraggable>
		<MkButton rounded style="margin: 0 auto;" @click="addChildValue"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
	</div>

	<div v-else-if="v.type === 'not'" :class="$style.item">
		<RolesEditorFormula v-model="v.value"/>
	</div>

	<MkInput v-else-if="v.type === 'createdLessThan' || v.type === 'createdMoreThan'" v-model="v.sec" type="number">
		<template #suffix>sec</template>
	</MkInput>

	<MkInput v-else-if="v.type === 'followersLessThanOrEq' || v.type === 'followersMoreThanOrEq' || v.type === 'followingLessThanOrEq' || v.type === 'followingMoreThanOrEq' || v.type === 'notesLessThanOrEq' || v.type === 'notesMoreThanOrEq'" v-model="v.value" type="number">
	</MkInput>

	<MkSelect v-else-if="v.type === 'roleAssignedTo'" v-model="v.roleId" :items="assignedToDef">
	</MkSelect>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import type { GetMkSelectValueTypesFromDef, MkSelectItem } from '@/components/MkSelect.vue';
import { genId } from '@/utility/id.js';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import MkDraggable from '@/components/MkDraggable.vue';
import { i18n } from '@/i18n.js';
import { deepClone } from '@/utility/clone.js';
import { rolesCache } from '@/cache.js';

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.Role['condFormula']): void;
	(ev: 'remove'): void;
}>();

const props = defineProps<{
	modelValue: Misskey.entities.Role['condFormula'];
	draggable?: boolean;
	dragStartCallback?: (ev: DragEvent) => void;
}>();

const v = ref(deepClone(props.modelValue));

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

type KeyOfUnion<T> = T extends T ? keyof T : never;

type DistributiveOmit<T, K extends KeyOfUnion<T>> = T extends T
	? Omit<T, K>
	: never;

const typeModelForMkSelect = computed<GetMkSelectValueTypesFromDef<typeof typeDef>>({
	get: () => v.value.type,
	set: (t) => {
		let newValue: DistributiveOmit<Misskey.entities.Role['condFormula'], 'id'>;
		switch (t) {
			case 'and': newValue = { type: 'and', values: [] }; break;
			case 'or': newValue = { type: 'or', values: [] }; break;
			case 'not': newValue = { type: 'not', value: { id: genId(), type: 'isRemote' } }; break;
			case 'roleAssignedTo': newValue = { type: 'roleAssignedTo', roleId: '' }; break;
			case 'createdLessThan': newValue = { type: 'createdLessThan', sec: 86400 }; break;
			case 'createdMoreThan': newValue = { type: 'createdMoreThan', sec: 86400 }; break;
			case 'followersLessThanOrEq': newValue = { type: 'followersLessThanOrEq', value: 10 }; break;
			case 'followersMoreThanOrEq': newValue = { type: 'followersMoreThanOrEq', value: 10 }; break;
			case 'followingLessThanOrEq': newValue = { type: 'followingLessThanOrEq', value: 10 }; break;
			case 'followingMoreThanOrEq': newValue = { type: 'followingMoreThanOrEq', value: 10 }; break;
			case 'notesLessThanOrEq': newValue = { type: 'notesLessThanOrEq', value: 10 }; break;
			case 'notesMoreThanOrEq': newValue = { type: 'notesMoreThanOrEq', value: 10 }; break;
			default: newValue = { type: t }; break;
		}
		v.value = { id: v.value.id, ...newValue };
	},
});

const assignedToDef = computed(() => roles.filter(r => r.target === 'manual').map(r => ({ label: r.name, value: r.id })) satisfies MkSelectItem[]);

function addChildValue() {
	if (v.value.type !== 'and' && v.value.type !== 'or') return;
	v.value.values.push({ id: genId(), type: 'isRemote' });
}

function childValuesItemUpdated(item: Misskey.entities.Role['condFormula']) {
	if (v.value.type !== 'and' && v.value.type !== 'or') return;
	const i = v.value.values.findIndex(_item => _item.id === item.id);
	v.value.values[i] = item;
}

function removeChildItem(itemId: string) {
	if (v.value.type !== 'and' && v.value.type !== 'or') return;
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
