import { Meta, Story } from '@storybook/vue3';
import MkObjectView from './MkObjectView.vue';
const meta = {
	title: 'components/MkObjectView',
	component: MkObjectView,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkObjectView,
			},
			props: Object.keys(argTypes),
			template: '<MkObjectView v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
