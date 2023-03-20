import { Meta, Story } from '@storybook/vue3';
import MkObjectView from './MkObjectView.vue';
const meta = {
	title: 'components/MkObjectView',
	component: MkObjectView,
};
export const Default = {
	components: {
		MkObjectView,
	},
	template: '<MkObjectView />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
