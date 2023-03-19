import { Meta, Story } from '@storybook/vue3';
import channel from './channel.vue';
const meta = {
	title: 'pages/channel',
	component: channel,
};
export const Default = {
	components: {
		channel,
	},
	template: '<channel />',
};
export default meta;
