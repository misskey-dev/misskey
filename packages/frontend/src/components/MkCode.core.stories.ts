import { Meta, Story } from '@storybook/vue3';
import MkCode_core from './MkCode.core.vue';
const meta = {
	title: 'components/MkCode.core',
	component: MkCode_core,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkCode_core,
			},
			props: Object.keys(argTypes),
			template: '<MkCode_core v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
