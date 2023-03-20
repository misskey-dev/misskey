import { Meta, Story } from '@storybook/vue3';
import federation from './federation.vue';
const meta = {
	title: 'pages/admin/federation',
	component: federation,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				federation,
			},
			props: Object.keys(argTypes),
			template: '<federation v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
