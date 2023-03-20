import { Meta, StoryObj } from '@storybook/vue3';
import create from './create.vue';
const meta = {
	title: 'pages/my-antennas/create',
	component: create,
} satisfies Meta<typeof create>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				create,
			},
			props: Object.keys(argTypes),
			template: '<create v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof create>;
export default meta;
