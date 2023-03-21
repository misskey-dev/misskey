import { Meta, StoryObj } from '@storybook/vue3';
import create_ from './create.vue';
const meta = {
	title: 'pages/my-antennas/create',
	component: create_,
} satisfies Meta<typeof create_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				create_,
			},
			props: Object.keys(argTypes),
			template: '<create_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof create_>;
export default meta;
