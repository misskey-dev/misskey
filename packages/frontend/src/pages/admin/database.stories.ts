import { Meta, StoryObj } from '@storybook/vue3';
import database from './database.vue';
const meta = {
	title: 'pages/admin/database',
	component: database,
} satisfies Meta<typeof database>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				database,
			},
			props: Object.keys(argTypes),
			template: '<database v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof database>;
export default meta;
