<template>
<MkModalWindow
	ref="dialog"
	:width="450"
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

	<MkSpacer :margin-min="20" :margin-max="32">
		<div class="_gaps_m">
			<template v-for="item in Object.keys(form).filter(item => !form[item].hidden)">
				<MkInput v-if="form[item].type === 'number'" v-model="values[item]" type="number" :step="form[item].step || 1">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</MkInput>
				<MkInput v-else-if="form[item].type === 'string' && !form[item].multiline" v-model="values[item]" type="text">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</MkInput>
				<MkTextarea v-else-if="form[item].type === 'string' && form[item].multiline" v-model="values[item]">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</MkTextarea>
				<MkSwitch v-else-if="form[item].type === 'boolean'" v-model="values[item]">
					<span v-text="form[item].label || item"></span>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</MkSwitch>
				<MkSelect v-else-if="form[item].type === 'enum'" v-model="values[item]">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<option v-for="item in form[item].enum" :key="item.value" :value="item.value">{{ item.label }}</option>
				</MkSelect>
				<MkRadios v-else-if="form[item].type === 'radio'" v-model="values[item]">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<option v-for="item in form[item].options" :key="item.value" :value="item.value">{{ item.label }}</option>
				</MkRadios>
				<MkRange v-else-if="form[item].type === 'range'" v-model="values[item]" :min="form[item].min" :max="form[item].max" :step="form[item].step" :text-converter="form[item].textConverter">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</MkRange>
				<MkButton v-else-if="form[item].type === 'button'" @click="form[item].action($event, values)">
					<span v-text="form[item].content || item"></span>
				</MkButton>
			</template>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkInput from './MkInput.vue';
import MkTextarea from './MkTextarea.vue';
import MkSwitch from './MkSwitch.vue';
import MkSelect from './MkSelect.vue';
import MkRange from './MkRange.vue';
import MkButton from './MkButton.vue';
import MkRadios from './MkRadios.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n';

export default defineComponent({
	components: {
		MkModalWindow,
		MkInput,
		MkTextarea,
		MkSwitch,
		MkSelect,
		MkRange,
		MkButton,
		MkRadios,
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
			values: {},
			i18n,
		};
	},

	created() {
		for (const item in this.form) {
			this.values[item] = this.form[item].default ?? null;
		}
	},

	methods: {
		ok() {
			this.$emit('done', {
				result: this.values,
			});
			this.$refs.dialog.close();
		},

		cancel() {
			this.$emit('done', {
				canceled: true,
			});
			this.$refs.dialog.close();
		},
	},
});
</script>
