import { Meta, StoryObj } from '@storybook/vue3';
import followers from './followers.vue';
const meta = {
	title: 'pages/user/followers',
	component: followers,
} satisfies Meta<typeof followers>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				followers,
			},
			props: Object.keys(argTypes),
			template: '<followers v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof followers>;
export default meta;
