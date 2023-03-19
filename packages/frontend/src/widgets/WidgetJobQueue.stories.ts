import { Meta, Story } from '@storybook/vue3';
import WidgetJobQueue from './WidgetJobQueue.vue';
const meta = {
	title: 'widgets/WidgetJobQueue',
	component: WidgetJobQueue,
};
export const Default = {
	components: {
		WidgetJobQueue,
	},
	template: '<WidgetJobQueue />',
};
export default meta;
