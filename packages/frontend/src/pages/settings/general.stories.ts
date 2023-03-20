import { Meta, StoryObj } from '@storybook/vue3';
import general from './general.vue';
const meta = {
	title: 'pages/settings/general',
	component: general,
} satisfies Meta<typeof general>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				general,
			},
			props: Object.keys(argTypes),
			template: '<general v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof general>;
export default meta;
