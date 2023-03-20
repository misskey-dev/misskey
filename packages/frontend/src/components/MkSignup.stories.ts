import { Meta, Story } from '@storybook/vue3';
import MkSignup from './MkSignup.vue';
const meta = {
	title: 'components/MkSignup',
	component: MkSignup,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkSignup,
			},
			props: Object.keys(argTypes),
			template: '<MkSignup v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
