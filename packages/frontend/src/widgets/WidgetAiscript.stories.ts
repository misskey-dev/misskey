import { Meta, Story } from '@storybook/vue3';
import WidgetAiscript from './WidgetAiscript.vue';
const meta = {
	title: 'widgets/WidgetAiscript',
	component: WidgetAiscript,
};
export const Default = {
	components: {
		WidgetAiscript,
	},
	template: '<WidgetAiscript />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
