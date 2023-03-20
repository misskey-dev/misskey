import { Meta, Story } from '@storybook/vue3';
import statusbar_federation from './statusbar-federation.vue';
const meta = {
	title: 'ui/_common_/statusbar-federation',
	component: statusbar_federation,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				statusbar_federation,
			},
			props: Object.keys(argTypes),
			template: '<statusbar_federation v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
