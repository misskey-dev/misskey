import { Meta, Story } from '@storybook/vue3';
import MkObjectView_value from './MkObjectView.value.vue';
const meta = {
	title: 'components/MkObjectView.value',
	component: MkObjectView_value,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkObjectView_value,
			},
			props: Object.keys(argTypes),
			template: '<MkObjectView_value v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
