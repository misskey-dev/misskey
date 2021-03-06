<script lang="ts">
import { defineComponent, h } from 'vue';
import MkRadio from '@/components/ui/radio.vue';

export default defineComponent({
	components: {
		MkRadio
	},
	props: {
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
	},
	render() {
		const label = this.$slots.desc();
		const options = this.$slots.default();

		return h('div', {
			class: 'novjtcto'
		}, [
			h('div', label),
			...options.map(option => h(MkRadio, {
				key: option.props.value,
				value: option.props.value,
				modelValue: this.value,
				'onUpdate:modelValue': value => this.value = value,
			}, option.children))
		]);
	}
});
</script>

<style lang="scss">
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
