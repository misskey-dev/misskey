<!--
SPDX-FileCopyrightText: Type4ny-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div :class="$style.header">
		<MkSelect v-model="type" :class="$style.typeSelect">
			<optgroup :label="i18n.ts.accounts">
				<option value="isLocked">{{ i18n.ts._role._condition.isLocked }}</option>
				<option value="isBot">{{ i18n.ts._role._condition.isBot }}</option>
				<option value="isCat">{{ i18n.ts._role._condition.isCat }}</option>
				<option value="createdLessThan">{{ i18n.ts._role._condition.createdLessThan }}</option>
				<option value="createdMoreThan">{{ i18n.ts._role._condition.createdMoreThan }}</option>
				<option value="followersLessThanOrEq">{{ i18n.ts._role._condition.followersLessThanOrEq }}</option>
				<option value="followersMoreThanOrEq">{{ i18n.ts._role._condition.followersMoreThanOrEq }}</option>
				<option value="followingLessThanOrEq">{{ i18n.ts._role._condition.followingLessThanOrEq }}</option>
				<option value="followingMoreThanOrEq">{{ i18n.ts._role._condition.followingMoreThanOrEq }}</option>
				<option value="notesLessThanOrEq">{{ i18n.ts._role._condition.notesLessThanOrEq }}</option>
				<option value="notesMoreThanOrEq">{{ i18n.ts._role._condition.notesMoreThanOrEq }}</option>
			</optgroup>
			<optgroup v-if="isNote" :label="i18n.ts._inboxRule.notes">
				<option value="maxMentionsMoreThanOrEq">{{ i18n.ts._inboxRule.maxMentionsMoreThanOrEq }}</option>
				<option value="attachmentFileMoreThanOrEq">{{ i18n.ts._inboxRule.attachmentFileMoreThanOrEq }}</option>
				<option value="isIncludeThisWord">{{ i18n.ts._inboxRule.isIncludeThisWord }}</option>
			</optgroup>
			<optgroup label="Servers">
				<option value="serverHost">{{ i18n.ts._inboxRule.serverHost }}</option>
				<option value="serverSoftware">{{ i18n.ts._inboxRule.serverSoftware }}</option>
				<option value="serverIsSilenced">{{ i18n.ts._inboxRule.serverIsSilenced }}</option>
				<option value="serverPubLessThanOrEq">{{ i18n.ts._inboxRule.serverPubLessThanOrEq }}</option>
				<option value="serverPubMoreThanOrEq">{{ i18n.ts._inboxRule.serverPubMoreThanOrEq }}</option>
				<option value="serverSubLessThanOrEq">{{ i18n.ts._inboxRule.serverSubLessThanOrEq }}</option>
				<option value="serverSubMoreThanOrEq">{{ i18n.ts._inboxRule.serverSubMoreThanOrEq }}</option>
			</optgroup>
			<optgroup :label="i18n.ts._inboxRule.conditions">
				<option v-if="!isNote" value="thisActivityIsNote">{{ i18n.ts._inboxRule.thisActivityIsNote }}</option>
				<option value="and">{{ i18n.ts._inboxRule.and }}</option>
				<option value="or">{{ i18n.ts._inboxRule.or }}</option>
				<option value="not">{{ i18n.ts._inboxRule.not }}</option>
			</optgroup>
		</MkSelect>
		<button v-if="draggable" class="drag-handle _button" :class="$style.dragHandle">
			<i class="ti ti-menu-2"></i>
		</button>
		<button v-if="draggable" class="_button" :class="$style.remove" @click="removeSelf">
			<i class="ti ti-x"></i>
		</button>
	</div>

	<div v-if="type === 'and' || type === 'or' || type === 'thisActivityIsNote'" class="_gaps">
		<Sortable v-model="v.values" tag="div" class="_gaps" itemKey="id" handle=".drag-handle" :group="{ name: 'inboxRuleFormula' }" :animation="150" :swapThreshold="0.5">
			<template #item="{element}">
				<div :class="$style.item">
					<!-- divが無いとエラーになる https://github.com/SortableJS/vue.draggable.next/issues/189 -->
					<InboxModerationEditorFormula :modelValue="element" :isNote="type === 'thisActivityIsNote'" draggable @update:modelValue="updated => valuesItemUpdated(updated)" @remove="removeItem(element)"/>
				</div>
			</template>
		</Sortable>
		<MkButton rounded style="margin: 0 auto;" @click="addValue"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
	</div>

	<div v-else-if="type === 'not'" :class="$style.item">
		<InboxModerationEditorFormula v-model="v.value"/>
	</div>

	<MkInput v-else-if="type === 'createdLessThan' || type === 'createdMoreThan'" v-model="v.sec" type="number">
		<template #suffix>sec</template>
	</MkInput>

	<MkInput
		v-else-if="[
			'followersLessThanOrEq',
			'followersMoreThanOrEq',
			'followingLessThanOrEq',
			'followingMoreThanOrEq',
			'notesLessThanOrEq',
			'notesMoreThanOrEq',
			'serverPubLessThanOrEq',
			'serverPubMoreThanOrEq',
			'serverSubLessThanOrEq',
			'serverSubMoreThanOrEq',
			'maxMentionsMoreThanOrEq',
			'attachmentFileMoreThanOrEq',
		].includes(type)" v-model="v.value" type="number"
	>
	</MkInput>

	<MkInput
		v-else-if="[
			'serverHost',
			'serverSoftware',
			'isIncludeThisWord',
		].includes(type)" v-model="v.value"
	>
	</MkInput>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { deepClone } from '@/scripts/clone.js';

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const emit = defineEmits<{
	(ev: 'update:modelValue', value: any): void;
	(ev: 'remove'): void;
}>();

const props = defineProps<{
	modelValue: any;
	draggable?: boolean;
	isNote?: boolean;
}>();

const v = ref(deepClone(props.modelValue));

watch(() => props.modelValue, () => {
	if (JSON.stringify(props.modelValue) === JSON.stringify(v.value)) return;
	v.value = deepClone(props.modelValue);
}, { deep: true });

watch(v, () => {
	emit('update:modelValue', v.value);
}, { deep: true });

const type = computed({
	get: () => v.value.type,
	set: (t) => {
		if (t === 'and') v.value.values = [];
		if (t === 'or') v.value.values = [];
		if (t === 'thisActivityIsNote') v.value.values = [];
		if (t === 'not') v.value.value = { id: uuid(), type: 'isRemote' };
		if (t === 'roleAssignedTo') v.value.roleId = '';
		if (t === 'createdLessThan') v.value.sec = 86400;
		if (t === 'createdMoreThan') v.value.sec = 86400;
		if (t === 'followersLessThanOrEq') v.value.value = 10;
		if (t === 'followersMoreThanOrEq') v.value.value = 10;
		if (t === 'followingLessThanOrEq') v.value.value = 10;
		if (t === 'followingMoreThanOrEq') v.value.value = 10;
		if (t === 'maxMentionsMoreThanOrEq') v.value.value = 5;
		if (t === 'attachmentFileMoreThanOrEq') v.value.value = 16;
		if (t === 'notesLessThanOrEq') v.value.value = 10;
		if (t === 'notesMoreThanOrEq') v.value.value = 10;
		if (t === 'serverPubLessThanOrEq') v.value.value = 5;
		if (t === 'serverPubMoreThanOrEq') v.value.value = 5;
		if (t === 'serverSubLessThanOrEq') v.value.value = 5;
		if (t === 'serverSubMoreThanOrEq') v.value.value = 5;
		if (t === 'serverHost') v.value.value = '';
		if (t === 'serverSoftware') v.value.value = '';
		if (t === 'isIncludeThisWord') v.value.value = '';
		v.value.type = t;
	},
});

function addValue() {
	v.value.values.push({ id: uuid(), type: 'isRemote' });
}

function valuesItemUpdated(item) {
	const i = v.value.values.findIndex(_item => _item.id === item.id);
	v.value.values[i] = item;
}

function removeItem(item) {
	v.value.values = v.value.values.filter(_item => _item.id !== item.id);
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
	border: solid 2px var(--divider);
	border-radius: var(--radius);
	padding: 12px;

	&:hover {
		border-color: var(--accent);
	}
}
</style>
