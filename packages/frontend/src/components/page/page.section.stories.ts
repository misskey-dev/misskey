import { Meta, Story } from '@storybook/vue3';
import page_section from './page.section.vue';
const meta = {
	title: 'components/page/page.section',
	component: page_section,
};
export const Default = {
	components: {
		page_section,
	},
	template: '<page_section />',
};
export default meta;
