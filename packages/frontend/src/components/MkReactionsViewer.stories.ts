import { Meta, Story } from '@storybook/vue3';
import MkReactionsViewer from './MkReactionsViewer.vue';
const meta = {
	title: 'components/MkReactionsViewer',
	component: MkReactionsViewer,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkReactionsViewer,
			},
			props: Object.keys(argTypes),
			template: '<MkReactionsViewer v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
