import { Meta, StoryObj } from '@storybook/vue3';
import apps from './apps.vue';
const meta = {
	title: 'pages/settings/apps',
	component: apps,
} satisfies Meta<typeof apps>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				apps,
			},
			props: Object.keys(argTypes),
			template: '<apps v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof apps>;
export default meta;
