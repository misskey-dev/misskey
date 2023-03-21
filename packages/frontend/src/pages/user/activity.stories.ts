import { Meta, StoryObj } from '@storybook/vue3';
import activity_ from './activity.vue';
const meta = {
	title: 'pages/user/activity',
	component: activity_,
} satisfies Meta<typeof activity_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				activity_,
			},
			props: Object.keys(argTypes),
			template: '<activity_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof activity_>;
export default meta;
