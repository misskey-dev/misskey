import { Meta, Story } from '@storybook/vue3';
import MkPageHeader_tabs from './MkPageHeader.tabs.vue';
const meta = {
	title: 'components/global/MkPageHeader.tabs',
	component: MkPageHeader_tabs,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPageHeader_tabs,
			},
			props: Object.keys(argTypes),
			template: '<MkPageHeader_tabs v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
