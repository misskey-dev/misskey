import { Meta, Story } from '@storybook/vue3';
import MkImageViewer from './MkImageViewer.vue';
const meta = {
	title: 'components/MkImageViewer',
	component: MkImageViewer,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkImageViewer,
			},
			props: Object.keys(argTypes),
			template: '<MkImageViewer v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
