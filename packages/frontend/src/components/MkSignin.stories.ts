import { Meta, Story } from '@storybook/vue3';
import MkSignin from './MkSignin.vue';
const meta = {
	title: 'components/MkSignin',
	component: MkSignin,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkSignin,
			},
			props: Object.keys(argTypes),
			template: '<MkSignin v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
