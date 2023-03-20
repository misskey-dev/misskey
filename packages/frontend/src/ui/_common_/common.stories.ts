import { Meta, Story } from '@storybook/vue3';
import common from './common.vue';
const meta = {
	title: 'ui/_common_/common',
	component: common,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				common,
			},
			props: Object.keys(argTypes),
			template: '<common v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
