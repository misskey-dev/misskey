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
	<div class="xkpnjxcv _section">
		<label v-for="item in Object.keys(form).filter(item => !form[item].hidden)" :key="item">
			<MkInput v-if="form[item].type === 'number'" v-model:value="values[item]" type="number" :step="form[item].step || 1">
				<span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ $t('optional') }})</span>
				<template v-if="form[item].description" #desc>{{ form[item].description }}</template>
			</MkInput>
			<MkInput v-else-if="form[item].type === 'string' && !form[item].multiline" v-model:value="values[item]" type="text">
				<span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ $t('optional') }})</span>
				<template v-if="form[item].description" #desc>{{ form[item].description }}</template>
			</MkInput>
			<MkTextarea v-else-if="form[item].type === 'string' && form[item].multiline" v-model:value="values[item]">
				<span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ $t('optional') }})</span>
				<template v-if="form[item].description" #desc>{{ form[item].description }}</template>
			</MkTextarea>
			<MkSwitch v-else-if="form[item].type === 'boolean'" v-model:value="values[item]">
				<span v-text="form[item].label || item"></span>
				<template v-if="form[item].description" #desc>{{ form[item].description }}</template>
			</MkSwitch>
		</label>
	</div>
</XModalWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import MkInput from './ui/input.vue';
import MkTextarea from './ui/textarea.vue';
import MkSwitch from './ui/switch.vue';

export default defineComponent({
	components: {
		XModalWindow,
		MkInput,
		MkTextarea,
		MkSwitch,
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
	> label {
		display: block;

		&:not(:last-child) {
			margin-bottom: 32px;
		}
	}
}
</style>
