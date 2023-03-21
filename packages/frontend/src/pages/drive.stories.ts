import { Meta, StoryObj } from '@storybook/vue3';
import drive_ from './drive.vue';
const meta = {
	title: 'pages/drive',
	component: drive_,
} satisfies Meta<typeof drive_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				drive_,
			},
			props: Object.keys(argTypes),
			template: '<drive_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof drive_>;
export default meta;
