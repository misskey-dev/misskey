import { Meta, Story } from '@storybook/vue3';
import MkPopupMenu from './MkPopupMenu.vue';
const meta = {
	title: 'components/MkPopupMenu',
	component: MkPopupMenu,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPopupMenu,
			},
			props: Object.keys(argTypes),
			template: '<MkPopupMenu v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
