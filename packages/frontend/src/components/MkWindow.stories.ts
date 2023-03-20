import { Meta, Story } from '@storybook/vue3';
import MkWindow from './MkWindow.vue';
const meta = {
	title: 'components/MkWindow',
	component: MkWindow,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkWindow,
			},
			props: Object.keys(argTypes),
			template: '<MkWindow v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
