import { Meta, Story } from '@storybook/vue3';
import user_info from './user-info.vue';
const meta = {
	title: 'pages/user-info',
	component: user_info,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				user_info,
			},
			props: Object.keys(argTypes),
			template: '<user_info v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
