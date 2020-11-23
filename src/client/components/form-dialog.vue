<template>
<XModalWindow ref="dialog"
	:width="400"
	:can-close="false"
	:with-ok-button="true"
	:ok-button-disabled="false"
	@click="cancel()"
	@ok="ok()"
	@close="cancel()"
	@closed="$emit('closed')"
>
	<template #header>
		{{ title }}
	</template>
	<FormBase class="xkpnjxcv">
		<template v-for="item in Object.keys(form).filter(item => !form[item].hidden)">
			<FormInput v-if="form[item].type === 'number'" v-model:value="values[item]" type="number" :step="form[item].step || 1">
				<span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ $t('optional') }})</span>
				<template v-if="form[item].description" #desc>{{ form[item].description }}</template>
			</FormInput>
			<FormInput v-else-if="form[item].type === 'string' && !form[item].multiline" v-model:value="values[item]" type="text">
				<span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ $t('optional') }})</span>
				<template v-if="form[item].description" #desc>{{ form[item].description }}</template>
			</FormInput>
			<FormTextarea v-else-if="form[item].type === 'string' && form[item].multiline" v-model:value="values[item]">
				<span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ $t('optional') }})</span>
				<template v-if="form[item].description" #desc>{{ form[item].description }}</template>
			</FormTextarea>
			<FormSwitch v-else-if="form[item].type === 'boolean'" v-model:value="values[item]">
				<span v-text="form[item].label || item"></span>
				<template v-if="form[item].description" #desc>{{ form[item].description }}</template>
			</FormSwitch>
			<FormSelect v-else-if="form[item].type === 'enum'" v-model:value="values[item]">
				<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ $t('optional') }})</span></template>
				<option v-for="item in form[item].enum" :value="item.value" :key="item.value">{{ item.label }}</option>
			</FormSelect>
			<FormRange v-else-if="form[item].type === 'range'" v-model:value="values[item]" :min="form[item].mim" :max="form[item].max" :step="form[item].step">
				<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ $t('optional') }})</span></template>
				<template v-if="form[item].description" #desc>{{ form[item].description }}</template>
			</FormRange>
			<FormButton v-else-if="form[item].type === 'button'" @click="form[item].action($event, values)">
				<span v-text="form[item].content || item"></span>
			</FormButton>
		</template>
	</FormBase>
</XModalWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import FormBase from './form/base.vue';
import FormInput from './form/input.vue';
import FormTextarea from './form/textarea.vue';
import FormSwitch from './form/switch.vue';
import FormSelect from './form/select.vue';
import FormRange from './form/range.vue';
import FormButton from './form/button.vue';

export default defineComponent({
	components: {
		XModalWindow,
		FormBase,
		FormInput,
		FormTextarea,
		FormSwitch,
		FormSelect,
		FormRange,
		FormButton,
	},

	props: {
		title: {
			type: String,
			required: true,
		},
		form: {
			type: Object,
			required: true,
		},
	},

	emits: ['done'],

	data() {
		return {
			values: {}
		};
	},

	created() {
		for (const item in this.form) {
			this.values[item] = this.form[item].hasOwnProperty('default') ? this.form[item].default : null;
		}
	},

	methods: {
		ok() {
			this.$emit('done', {
				result: this.values
			});
			this.$refs.dialog.close();
		},

		cancel() {
			this.$emit('done', {
				canceled: true
			});
			this.$refs.dialog.close();
		}
	}
});
</script>

<style lang="scss" scoped>
.xkpnjxcv {

}
</style>
