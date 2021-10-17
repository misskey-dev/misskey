<script lang="ts">
import { defineComponent, h } from 'vue';
import MkRadio from './radio.vue';

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
		let options = this.$slots.default();

		// なぜかFragmentになることがあるため
		if (options.length === 1 && options[0].props == null) options = options[0].children;

		return h('div', {
			class: 'novjtcto'
		}, [
			...options.map(option => h(MkRadio, {
				key: option.key,
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
	&:first-child {
		margin-top: 0;
	}

	&:last-child {
		margin-bottom: 0;
	}
}
</style>
