import { Meta, StoryObj } from '@storybook/vue3';
import welcome_entrance_c from './welcome.entrance.c.vue';
const meta = {
	title: 'pages/welcome.entrance.c',
	component: welcome_entrance_c,
} satisfies Meta<typeof welcome_entrance_c>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				welcome_entrance_c,
			},
			props: Object.keys(argTypes),
			template: '<welcome_entrance_c v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof welcome_entrance_c>;
export default meta;
