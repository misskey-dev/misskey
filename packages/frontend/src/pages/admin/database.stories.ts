import { Meta, StoryObj } from '@storybook/vue3';
import database_ from './database.vue';
const meta = {
	title: 'pages/admin/database',
	component: database_,
} satisfies Meta<typeof database_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				database_,
			},
			props: Object.keys(argTypes),
			template: '<database_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof database_>;
export default meta;
