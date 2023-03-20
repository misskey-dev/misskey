import { Meta, Story } from '@storybook/vue3';
import MkCode from './MkCode.vue';
const meta = {
	title: 'components/MkCode',
	component: MkCode,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkCode,
			},
			props: Object.keys(argTypes),
			template: '<MkCode v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
