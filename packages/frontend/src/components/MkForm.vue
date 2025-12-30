<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="Object.keys(form).filter(item => !form[item].hidden).length > 0" class="_gaps_m">
	<template v-for="v, k in form">
		<template v-if="typeof v.hidden == 'function' ? v.hidden(values) : v.hidden"></template>
		<MkInput v-else-if="v.type === 'number'" v-model="values[k]" type="number" :step="v.step || 1" :manualSave="v.manualSave">
			<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ i18n.ts.optional }})</span></template>
			<template v-if="v.description" #caption>{{ v.description }}</template>
		</MkInput>
		<MkInput v-else-if="v.type === 'string' && !v.multiline" v-model="values[k]" type="text" :mfmAutocomplete="v.treatAsMfm" :manualSave="v.manualSave">
			<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ i18n.ts.optional }})</span></template>
			<template v-if="v.description" #caption>{{ v.description }}</template>
		</MkInput>
		<MkTextarea v-else-if="v.type === 'string' && v.multiline" v-model="values[k]" :mfmAutocomplete="v.treatAsMfm" :mfmPreview="v.treatAsMfm" :manualSave="v.manualSave">
			<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ i18n.ts.optional }})</span></template>
			<template v-if="v.description" #caption>{{ v.description }}</template>
		</MkTextarea>
		<MkSwitch v-else-if="v.type === 'boolean'" v-model="values[k]">
			<span v-text="v.label || k"></span>
			<template v-if="v.description" #caption>{{ v.description }}</template>
		</MkSwitch>
		<MkSelect v-else-if="v.type === 'enum'" v-model="values[k]" :items="getMkSelectDef(v)">
			<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ i18n.ts.optional }})</span></template>
		</MkSelect>
		<MkRadios v-else-if="v.type === 'radio'" v-model="values[k]">
			<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ i18n.ts.optional }})</span></template>
			<option v-for="option in v.options" :key="getRadioKey(option)" :value="option.value">{{ option.label }}</option>
		</MkRadios>
		<MkRange v-else-if="v.type === 'range'" v-model="values[k]" :min="v.min" :max="v.max" :step="v.step" :textConverter="v.textConverter">
			<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ i18n.ts.optional }})</span></template>
			<template v-if="v.description" #caption>{{ v.description }}</template>
		</MkRange>
		<MkButton v-else-if="v.type === 'button'" @click="v.action($event, values)">
			<span v-text="v.content || k"></span>
		</MkButton>
		<XFile
			v-else-if="v.type === 'drive-file'"
			:fileId="v.defaultFileId"
			:validate="async f => !v.validate || await v.validate(f)"
			@update="f => values[k] = f"
		/>
	</template>
</div>
<MkResult v-else type="empty" :text="i18n.ts.nothingToConfigure"/>
</template>

<script lang="ts" setup>
import XFile from '@/components/MkForm.file.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkRange from '@/components/MkRange.vue';
import MkButton from '@/components/MkButton.vue';
import MkRadios from '@/components/MkRadios.vue';
import { i18n } from '@/i18n.js';
import type { MkSelectItem } from '@/components/MkSelect.vue';
import type { Form, EnumFormItem, RadioFormItem } from '@/utility/form.js';

const props = defineProps<{
	form: Form;
}>();

// TODO: ジェネリックにしたい
const values = defineModel<Record<string, any>>({ required: true });

function getMkSelectDef(def: EnumFormItem): MkSelectItem[] {
	return def.enum.map((v) => {
		if (typeof v === 'string') {
			return { value: v, label: v };
		} else {
			return { value: v.value, label: v.label };
		}
	});
}

function getRadioKey(e: RadioFormItem['options'][number]) {
	return typeof e.value === 'string' ? e.value : JSON.stringify(e.value);
}
</script>
