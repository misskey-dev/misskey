import { Meta, Story } from '@storybook/vue3';
import universal_widgets from './universal.widgets.vue';
const meta = {
	title: 'ui/universal.widgets',
	component: universal_widgets,
};
export const Default = {
	components: {
		universal_widgets,
	},
	template: '<universal_widgets />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
