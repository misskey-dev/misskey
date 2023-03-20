import { Meta, Story } from '@storybook/vue3';
import activity from './activity.vue';
const meta = {
	title: 'pages/user/activity',
	component: activity,
};
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
};
export default meta;
