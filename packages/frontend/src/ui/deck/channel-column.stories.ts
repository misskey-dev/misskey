import { Meta, Story } from '@storybook/vue3';
import channel_column from './channel-column.vue';
const meta = {
	title: 'ui/deck/channel-column',
	component: channel_column,
};
export const Default = {
	components: {
		channel_column,
	},
	template: '<channel_column />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
