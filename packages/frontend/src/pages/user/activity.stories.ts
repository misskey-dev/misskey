import { Meta, StoryObj } from '@storybook/vue3';
import activity from './activity.vue';
const meta = {
	title: 'pages/user/activity',
	component: activity,
} satisfies Meta<typeof activity>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				activity,
			},
			props: Object.keys(argTypes),
			template: '<activity v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof activity>;
export default meta;
