<template>
<x-window ref="window" :width="500" :height="500" @closed="() => { $emit('closed'); destroyDom(); }" :with-ok-button="true" :ok-button-disabled="false" @ok="ok()" :can-close="false">
	<template #header>
		{{ title }}
	</template>
	<div class="xkpnjxcv">
		<label v-for="item in Object.keys(form).filter(item => !form[item].hidden)" :key="item">
			<mk-input v-if="form[item].type === 'number'" v-model="values[item]" type="number" :step="form[item].step || 1"><span v-text="form[item].label || item"></span></mk-input>
			<mk-input v-else-if="form[item].type === 'string' && !item.multiline" v-model="values[item]" type="text"><span v-text="form[item].label || item"></span></mk-input>
			<mk-textarea v-else-if="form[item].type === 'string' && item.multiline" v-model="values[item]"><span v-text="form[item].label || item"></span></mk-textarea>
			<mk-switch v-else-if="form[item].type === 'boolean'" v-model="values[item]"><span v-text="form[item].label || item"></span></mk-switch>
		</label>
	</div>
</x-window>
</template>

<script lang="ts">
import Vue from 'vue';
import XWindow from './window.vue';
import MkInput from './ui/input.vue';
import MkTextarea from './ui/textarea.vue';
import MkSwitch from './ui/switch.vue';

export default Vue.extend({
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

	data() {
		return {
			values: {}
		};
	},

	created() {
		for (const item in this.form) {
			Vue.set(this.values, item, this.form[item].default || null);
		}
	},

	methods: {
		ok() {
			this.$emit('ok', this.values);
			this.$refs.window.close();
		},
	}
});
</script>

<style lang="scss" scoped>
.xkpnjxcv {
	> label {
		display: block;
		border-bottom: solid 1px var(--divider);
		padding: 24px 0;
	}
}
</style>
