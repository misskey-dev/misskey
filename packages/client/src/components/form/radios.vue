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
		};
	},
	watch: {
		value() {
			this.$emit('update:modelValue', this.value);
		}
	},
	render() {
		let options = this.$slots.default();
		const label = this.$slots.label && this.$slots.label();
		const caption = this.$slots.caption && this.$slots.caption();

		// なぜかFragmentになることがあるため
		if (options.length === 1 && options[0].props == null) options = options[0].children;

		return h('div', {
			class: 'novjtcto'
		}, [
			...(label ? [h('div', {
				class: 'label'
			}, [label])] : []),
			h('div', {
				class: 'body'
			}, options.map(option => h(MkRadio, {
					key: option.key,
					value: option.props.value,
					modelValue: this.value,
					'onUpdate:modelValue': value => this.value = value,
				}, option.children)),
			),
			...(caption ? [h('div', {
				class: 'caption'
			}, [caption])] : []),
		]);
	}
});
</script>

<style lang="scss">
.novjtcto {
	> .label {
		font-size: 0.85em;
		padding: 0 0 8px 0;
		user-select: none;

		&:empty {
			display: none;
		}
	}

	> .body {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		grid-gap: 12px;
	}

	> .caption {
		font-size: 0.85em;
		padding: 8px 0 0 0;
		color: var(--fgTransparentWeak);

		&:empty {
			display: none;
		}
	}
}
</style>
