import { Meta, Story } from '@storybook/vue3';
import MkMenu from './MkMenu.vue';
const meta = {
	title: 'components/MkMenu',
	component: MkMenu,
};
export const Default = {
	components: {
		MkMenu,
	},
	template: '<MkMenu />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
