import { Meta, Story } from '@storybook/vue3';
import MkToast from './MkToast.vue';
const meta = {
	title: 'components/MkToast',
	component: MkToast,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkToast,
			},
			props: Object.keys(argTypes),
			template: '<MkToast v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
