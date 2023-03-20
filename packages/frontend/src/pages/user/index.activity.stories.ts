import { Meta, Story } from '@storybook/vue3';
import index_activity from './index.activity.vue';
const meta = {
	title: 'pages/user/index.activity',
	component: index_activity,
};
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
};
export default meta;
