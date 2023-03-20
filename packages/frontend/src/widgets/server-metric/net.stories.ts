import { Meta, Story } from '@storybook/vue3';
import net from './net.vue';
const meta = {
	title: 'widgets/server-metric/net',
	component: net,
};
export const Default = {
	components: {
		net,
	},
	template: '<net />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
