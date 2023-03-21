/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import instance_info from './instance-info.vue';
const meta = {
	title: 'pages/instance-info',
	component: instance_info,
} satisfies Meta<typeof instance_info>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				instance_info,
			},
			props: Object.keys(argTypes),
			template: '<instance_info v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof instance_info>;
export default meta;
