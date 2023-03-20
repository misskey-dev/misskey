import { Meta, StoryObj } from '@storybook/vue3';
import index_activity from './index.activity.vue';
const meta = {
	title: 'pages/user/index.activity',
	component: index_activity,
} satisfies Meta<typeof index_activity>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				index_activity,
			},
			props: Object.keys(argTypes),
			template: '<index_activity v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof index_activity>;
export default meta;
