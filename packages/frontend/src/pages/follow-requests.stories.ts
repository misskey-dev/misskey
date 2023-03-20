import { Meta, StoryObj } from '@storybook/vue3';
import follow_requests from './follow-requests.vue';
const meta = {
	title: 'pages/follow-requests',
	component: follow_requests,
} satisfies Meta<typeof follow_requests>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				follow_requests,
			},
			props: Object.keys(argTypes),
			template: '<follow_requests v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof follow_requests>;
export default meta;
