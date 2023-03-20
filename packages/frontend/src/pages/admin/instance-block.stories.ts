import { Meta, StoryObj } from '@storybook/vue3';
import instance_block from './instance-block.vue';
const meta = {
	title: 'pages/admin/instance-block',
	component: instance_block,
} satisfies Meta<typeof instance_block>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				instance_block,
			},
			props: Object.keys(argTypes),
			template: '<instance_block v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof instance_block>;
export default meta;
