import { Meta, Story } from '@storybook/vue3';
import MkContextMenu from './MkContextMenu.vue';
const meta = {
	title: 'components/MkContextMenu',
	component: MkContextMenu,
};
export const Default = {
	components: {
		MkContextMenu,
	},
	template: '<MkContextMenu />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
