import { Meta, Story } from '@storybook/vue3';
import page_section from './page.section.vue';
const meta = {
	title: 'components/page/page.section',
	component: page_section,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_section,
			},
			props: Object.keys(argTypes),
			template: '<page_section v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
