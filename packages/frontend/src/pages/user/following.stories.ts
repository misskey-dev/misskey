import { Meta, StoryObj } from '@storybook/vue3';
import following_ from './following.vue';
const meta = {
	title: 'pages/user/following',
	component: following_,
} satisfies Meta<typeof following_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				following_,
			},
			props: Object.keys(argTypes),
			template: '<following_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof following_>;
export default meta;
