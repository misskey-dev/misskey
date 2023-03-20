import { Meta, StoryObj } from '@storybook/vue3';
import announcements from './announcements.vue';
const meta = {
	title: 'pages/admin/announcements',
	component: announcements,
} satisfies Meta<typeof announcements>;
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
} satisfies StoryObj<typeof announcements>;
export default meta;
