import { Meta, Story } from '@storybook/vue3';
import section from './section.vue';
const meta = {
	title: 'components/form/section',
	component: section,
};
export const Default = {
	components: {
		section,
	},
	template: '<section />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
