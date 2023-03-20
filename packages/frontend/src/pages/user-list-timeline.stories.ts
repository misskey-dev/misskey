import { Meta, StoryObj } from '@storybook/vue3';
import user_list_timeline from './user-list-timeline.vue';
const meta = {
	title: 'pages/user-list-timeline',
	component: user_list_timeline,
} satisfies Meta<typeof user_list_timeline>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				user_list_timeline,
			},
			props: Object.keys(argTypes),
			template: '<user_list_timeline v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof user_list_timeline>;
export default meta;
