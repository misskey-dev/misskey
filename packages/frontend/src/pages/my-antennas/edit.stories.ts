import { Meta, StoryObj } from '@storybook/vue3';
import edit_ from './edit.vue';
const meta = {
	title: 'pages/my-antennas/edit',
	component: edit_,
} satisfies Meta<typeof edit_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				edit_,
			},
			props: Object.keys(argTypes),
			template: '<edit_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof edit_>;
export default meta;
