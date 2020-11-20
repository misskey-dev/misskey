<script lang="ts">
import { defineComponent, h } from 'vue';
import MkRadio from '@/components/ui/radio.vue';
import './form.scss';

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
			class: 'cnklmpwm _form_item'
		}, [
			h('div', {
				class: '_form_label',
			}, label),
			...options.map(option => h('button', {
				class: '_button _form_panel',
				key: option.props.value,
				onClick: () => this.value = option.props.value,
			}, [h('span', {
				class: ['check', { checked: this.value === option.props.value }],
			}), option.children]))
		]);
	}
});
</script>

<style lang="scss">
.cnklmpwm {
	> button {
		display: block;
		width: 100%;
		box-sizing: border-box;
		padding: 14px 18px;
		text-align: left;

		&:not(:first-of-type) {
			border-top: none;
			border-top-left-radius: 0;
			border-top-right-radius: 0;
		}

		&:not(:last-of-type) {
			border-bottom: solid 1px var(--divider);
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
		}

		> .check {
			display: inline-block;
			vertical-align: bottom;
			position: relative;
			width: 20px;
			height: 20px;
			margin-right: 8px;
			background: none;
			border: 2px solid var(--inputBorder);
			border-radius: 100%;
			transition: inherit;

			&:after {
				content: "";
				display: block;
				position: absolute;
				top: 3px;
				right: 3px;
				bottom: 3px;
				left: 3px;
				border-radius: 100%;
				opacity: 0;
				transform: scale(0);
				transition: .4s cubic-bezier(.25,.8,.25,1);
			}

			&.checked {
				border-color: var(--accent);

				&:after {
					background-color: var(--accent);
					transform: scale(1);
					opacity: 1;
				}
			}
		}
	}
}
</style>
