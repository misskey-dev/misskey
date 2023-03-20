import { Meta, Story } from '@storybook/vue3';
import followers from './followers.vue';
const meta = {
	title: 'pages/user/followers',
	component: followers,
};
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
};
export default meta;
