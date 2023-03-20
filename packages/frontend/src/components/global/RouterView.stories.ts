import { Meta, Story } from '@storybook/vue3';
import RouterView from './RouterView.vue';
const meta = {
	title: 'components/global/RouterView',
	component: RouterView,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				RouterView,
			},
			props: Object.keys(argTypes),
			template: '<RouterView v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
