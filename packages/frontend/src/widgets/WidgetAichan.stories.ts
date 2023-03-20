import { Meta, Story } from '@storybook/vue3';
import WidgetAichan from './WidgetAichan.vue';
const meta = {
	title: 'widgets/WidgetAichan',
	component: WidgetAichan,
};
export const Default = {
	components: {
		WidgetAichan,
	},
	template: '<WidgetAichan />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
