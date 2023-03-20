import { Meta, Story } from '@storybook/vue3';
import reactions from './reactions.vue';
const meta = {
	title: 'pages/user/reactions',
	component: reactions,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				reactions,
			},
			props: Object.keys(argTypes),
			template: '<reactions v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
