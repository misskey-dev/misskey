import { Meta, StoryObj } from '@storybook/vue3';
import common_ from './common.vue';
const meta = {
	title: 'ui/_common_/common',
	component: common_,
} satisfies Meta<typeof common_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				common_,
			},
			props: Object.keys(argTypes),
			template: '<common_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof common_>;
export default meta;
