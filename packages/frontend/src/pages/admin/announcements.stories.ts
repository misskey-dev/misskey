import { Meta, Story } from '@storybook/vue3';
import announcements from './announcements.vue';
const meta = {
	title: 'pages/admin/announcements',
	component: announcements,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				announcements,
			},
			props: Object.keys(argTypes),
			template: '<announcements v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
