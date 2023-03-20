import { Meta, StoryObj } from '@storybook/vue3';
import settings from './settings.vue';
const meta = {
	title: 'pages/admin/settings',
	component: settings,
} satisfies Meta<typeof settings>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				settings,
			},
			props: Object.keys(argTypes),
			template: '<settings v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof settings>;
export default meta;
