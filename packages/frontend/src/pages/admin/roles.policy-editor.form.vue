<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkInput
	v-if="def.type === 'string' && def.multiline !== true && assertModelType(model, 'string')"
	v-model="model"
	type="text"
	:disabled="disabled"
	:readonly="readonly"
>
	<template #label>{{ def.inputLabel }}</template>
	<template #caption>
		<span v-if="typeof def.inputCaption === 'string'">{{ def.inputCaption }}</span>
		<component v-else :is="def.inputCaption" />
	</template>
</MkInput>
<MkTextarea
	v-else-if="def.type === 'string' && def.multiline === true && assertModelType(model, 'string')"
	v-model="model"
	:disabled="disabled"
	:readonly="readonly"
>
	<template #label>{{ def.inputLabel }}</template>
	<template #caption>
		<span v-if="typeof def.inputCaption === 'string'">{{ def.inputCaption }}</span>
		<component v-else :is="def.inputCaption" />
	</template>
</MkTextarea>
<MkInput
	v-else-if="def.type === 'number' && assertModelType(model, 'number')"
	v-model="model"
	type="number"
	:disabled="disabled"
	:readonly="readonly"
	:min="def.min"
	:max="def.max"
>
	<template #label>{{ def.inputLabel }}</template>
	<template #caption>
		<span v-if="typeof def.inputCaption === 'string'">{{ def.inputCaption }}</span>
		<component v-else :is="def.inputCaption" />
	</template>
	<template #prefix>{{ def.inputPrefix }}</template>
	<template #suffix>{{ def.inputSuffix }}</template>
</MkInput>
<MkRange
	v-else-if="def.type === 'range' && assertModelType(model, 'range')"
	v-model="model"
	:min="def.min"
	:max="def.max"
	:step="def.step"
	easing
	:disabled="disabled || readonly"
	:textConverter="def.textConverter"
>
	<template #label>{{ def.inputLabel }}</template>
	<template #caption>
		<span v-if="typeof def.inputCaption === 'string'">{{ def.inputCaption }}</span>
		<component v-else :is="def.inputCaption" />
	</template>
	<template #prefix>{{ def.inputPrefix }}</template>
	<template #suffix>{{ def.inputSuffix }}</template>
</MkRange>
<MkSelect
	v-else-if="def.type === 'enum' && assertModelType(model, 'enum')"
	v-model="model"
	:disabled="disabled"
	:readonly="readonly"
>
	<template #label>{{ def.inputLabel }}</template>
	<template #caption>
		<span v-if="typeof def.inputCaption === 'string'">{{ def.inputCaption }}</span>
		<component v-else :is="def.inputCaption" />
	</template>
	<option v-for="option in def.enum" :key="option.value" :value="option.value">{{ option.label }}</option>
</MkSelect>
<MkSwitch
	v-else-if="def.type === 'boolean' && assertModelType(model, 'boolean')"
	v-model="model"
	:disabled="disabled || readonly"
>
	<template #label>{{ def.inputLabel ?? i18n.ts.enable }}</template>
	<template #caption>
		<span v-if="typeof def.inputCaption === 'string'">{{ def.inputCaption }}</span>
		<component v-else :is="def.inputCaption" />
	</template>
</MkSwitch>
</template>

<script lang="ts" setup generic="D extends RolePolicyEditorItem">
import type { RolePolicyEditorItem, GetRolePolicyEditorValuesType } from '@/types/role-policy-editor.js';
import { i18n } from '@/i18n.js';

import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRange from '@/components/MkRange.vue';

const props = defineProps<{
	def: D;
	disabled?: boolean;
	readonly?: boolean;
}>();

const model = defineModel<GetRolePolicyEditorValuesType<D>>({ required: true });

function assertModelType<T extends RolePolicyEditorItem['type']>(m: unknown, type: T): m is GetRolePolicyEditorValuesType<Extract<RolePolicyEditorItem, { type: T }>> {
  return props.def.type === type;
}
</script>
