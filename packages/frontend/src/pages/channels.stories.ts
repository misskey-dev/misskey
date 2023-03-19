import { Meta, Story } from '@storybook/vue3';
import channels from './channels.vue';
const meta = {
	title: 'pages/channels',
	component: channels,
};
export const Default = {
	components: {
		channels,
	},
	template: '<channels />',
};
export default meta;
