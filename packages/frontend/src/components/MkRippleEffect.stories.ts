import { Meta, Story } from '@storybook/vue3';
import MkRippleEffect from './MkRippleEffect.vue';
const meta = {
	title: 'components/MkRippleEffect',
	component: MkRippleEffect,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkRippleEffect,
			},
			props: Object.keys(argTypes),
			template: '<MkRippleEffect v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
