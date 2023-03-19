import { Meta, Story } from '@storybook/vue3';
import WidgetFederation from './WidgetFederation.vue';
const meta = {
	title: 'widgets/WidgetFederation',
	component: WidgetFederation,
};
export const Default = {
	components: {
		WidgetFederation,
	},
	template: '<WidgetFederation />',
};
export default meta;
