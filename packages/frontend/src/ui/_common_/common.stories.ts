import { Meta, StoryObj } from '@storybook/vue3';
import common from './common.vue';
const meta = {
	title: 'ui/_common_/common',
	component: common,
} satisfies Meta<typeof common>;
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
} satisfies StoryObj<typeof common>;
export default meta;
