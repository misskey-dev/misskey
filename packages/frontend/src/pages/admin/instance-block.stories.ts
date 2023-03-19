import { Meta, Story } from '@storybook/vue3';
import instance_block from './instance-block.vue';
const meta = {
	title: 'pages/admin/instance-block',
	component: instance_block,
};
export const Default = {
	components: {
		instance_block,
	},
	template: '<instance-block />',
};
export default meta;
