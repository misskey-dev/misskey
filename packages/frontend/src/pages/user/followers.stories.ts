import { Meta, StoryObj } from '@storybook/vue3';
import followers_ from './followers.vue';
const meta = {
	title: 'pages/user/followers',
	component: followers_,
} satisfies Meta<typeof followers_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				followers_,
			},
			props: Object.keys(argTypes),
			template: '<followers_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof followers_>;
export default meta;
