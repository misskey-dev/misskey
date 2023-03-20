import { Meta, Story } from '@storybook/vue3';
import MkSuperMenu from './MkSuperMenu.vue';
const meta = {
	title: 'components/MkSuperMenu',
	component: MkSuperMenu,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkSuperMenu,
			},
			props: Object.keys(argTypes),
			template: '<MkSuperMenu v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
