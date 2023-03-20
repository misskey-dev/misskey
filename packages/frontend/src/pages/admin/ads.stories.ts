import { Meta, StoryObj } from '@storybook/vue3';
import ads from './ads.vue';
const meta = {
	title: 'pages/admin/ads',
	component: ads,
} satisfies Meta<typeof ads>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				ads,
			},
			props: Object.keys(argTypes),
			template: '<ads v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof ads>;
export default meta;
