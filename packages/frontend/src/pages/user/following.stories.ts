import { Meta, Story } from '@storybook/vue3';
import following from './following.vue';
const meta = {
	title: 'pages/user/following',
	component: following,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				following,
			},
			props: Object.keys(argTypes),
			template: '<following v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
