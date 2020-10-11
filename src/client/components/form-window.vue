<template>
<XWindow ref="window" :width="400" :height="450" @close="$emit('done')" :with-ok-button="true" :ok-button-disabled="false" @ok="ok()" :can-close="false">
	<template #header>
		{{ title }}
	</template>
	<div class="xkpnjxcv">
		<label v-for="item in Object.keys(form).filter(item => !form[item].hidden)" :key="item">
			<MkInput v-if="form[item].type === 'number'" v-model:value="values[item]" type="number" :step="form[item].step || 1">
				<span v-text="form[item].label || item"></span>
				<template v-if="form[item].description" #desc>{{ form[item].description }}</template>
			</MkInput>
			<MkInput v-else-if="form[item].type === 'string' && !item.multiline" v-model:value="values[item]" type="text">
				<span v-text="form[item].label || item"></span>
				<template v-if="form[item].description" #desc>{{ form[item].description }}</template>
			</MkInput>
			<MkTextarea v-else-if="form[item].type === 'string' && item.multiline" v-model:value="values[item]">
				<span v-text="form[item].label || item"></span>
				<template v-if="form[item].description" #desc>{{ form[item].description }}</template>
			</MkTextarea>
			<MkSwitch v-else-if="form[item].type === 'boolean'" v-model:value="values[item]">
				<span v-text="form[item].label || item"></span>
				<template v-if="form[item].description" #desc>{{ form[item].description }}</template>
			</MkSwitch>
		</label>
	</div>
</XWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XWindow from './window.vue';
import MkInput from './ui/input.vue';
import MkTextarea from './ui/textarea.vue';
import MkSwitch from './ui/switch.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XWindow,
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
			this.$emit('done', this.values);
		},
	}
});
</script>

<style lang="scss" scoped>
.xkpnjxcv {
	> label {
		display: block;
		padding: 16px 24px;
	}
}
</style>
