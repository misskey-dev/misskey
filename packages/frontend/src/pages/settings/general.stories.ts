import { Meta, StoryObj } from '@storybook/vue3';
import general_ from './general.vue';
const meta = {
	title: 'pages/settings/general',
	component: general_,
} satisfies Meta<typeof general_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				general_,
			},
			props: Object.keys(argTypes),
			template: '<general_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof general_>;
export default meta;
