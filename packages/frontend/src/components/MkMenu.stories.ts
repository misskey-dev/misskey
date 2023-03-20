import { Meta, Story } from '@storybook/vue3';
import MkMenu from './MkMenu.vue';
const meta = {
	title: 'components/MkMenu',
	component: MkMenu,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMenu,
			},
			props: Object.keys(argTypes),
			template: '<MkMenu v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
