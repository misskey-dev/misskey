<template>
<div
	class="novjtcto"
>
	<div><slot></slot></div>
	<MkRadio v-for="def in defs" v-model="value" :value="def.value" :key="def.value">{{ def.label }}</MkRadio>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkRadio from '@/components/ui/radio.vue';

export default defineComponent({
	components: {
		MkRadio
	},
	props: {
		defs: {
			required: true
		},
		modelValue: {
			required: false
		},
	},
	data() {
		return {
			value: this.modelValue,
		}
	},
	watch: {
		value() {
			this.$emit('update:modelValue', this.value);
		}
	}
});
</script>

<style lang="scss" scoped>
.novjtcto {
	margin: 32px 0;

	&:first-child {
		margin-top: 0;
	}

	&:last-child {
		margin-bottom: 0;
	}
}
</style>
