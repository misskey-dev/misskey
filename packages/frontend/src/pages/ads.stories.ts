import { Meta, StoryObj } from '@storybook/vue3';
import ads_ from './ads.vue';
const meta = {
	title: 'pages/ads',
	component: ads_,
} satisfies Meta<typeof ads_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				ads_,
			},
			props: Object.keys(argTypes),
			template: '<ads_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof ads_>;
export default meta;
