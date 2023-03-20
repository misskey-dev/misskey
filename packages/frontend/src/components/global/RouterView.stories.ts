import { Meta, Story } from '@storybook/vue3';
import RouterView from './RouterView.vue';
const meta = {
	title: 'components/global/RouterView',
	component: RouterView,
};
export const Default = {
	components: {
		RouterView,
	},
	template: '<RouterView />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
