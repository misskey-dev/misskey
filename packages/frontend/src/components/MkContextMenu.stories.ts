import { Meta, Story } from '@storybook/vue3';
import MkContextMenu from './MkContextMenu.vue';
const meta = {
	title: 'components/MkContextMenu',
	component: MkContextMenu,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkContextMenu,
			},
			props: Object.keys(argTypes),
			template: '<MkContextMenu v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
