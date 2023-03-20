import { Meta, Story } from '@storybook/vue3';
import WidgetAiscript from './WidgetAiscript.vue';
const meta = {
	title: 'widgets/WidgetAiscript',
	component: WidgetAiscript,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				WidgetAiscript,
			},
			props: Object.keys(argTypes),
			template: '<WidgetAiscript v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
