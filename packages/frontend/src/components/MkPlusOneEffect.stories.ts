import { Meta, Story } from '@storybook/vue3';
import MkPlusOneEffect from './MkPlusOneEffect.vue';
const meta = {
	title: 'components/MkPlusOneEffect',
	component: MkPlusOneEffect,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPlusOneEffect,
			},
			props: Object.keys(argTypes),
			template: '<MkPlusOneEffect v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
