import { Meta, Story } from '@storybook/vue3';
import MkReactionsViewer_details from './MkReactionsViewer.details.vue';
const meta = {
	title: 'components/MkReactionsViewer.details',
	component: MkReactionsViewer_details,
};
export const Default = {
	components: {
		MkReactionsViewer_details,
	},
	template: '<MkReactionsViewer_details />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
