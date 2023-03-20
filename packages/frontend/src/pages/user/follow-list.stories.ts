import { Meta, Story } from '@storybook/vue3';
import follow_list from './follow-list.vue';
const meta = {
	title: 'pages/user/follow-list',
	component: follow_list,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				follow_list,
			},
			props: Object.keys(argTypes),
			template: '<follow_list v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
