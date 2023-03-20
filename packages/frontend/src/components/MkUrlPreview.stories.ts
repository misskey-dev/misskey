import { Meta, Story } from '@storybook/vue3';
import MkUrlPreview from './MkUrlPreview.vue';
const meta = {
	title: 'components/MkUrlPreview',
	component: MkUrlPreview,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUrlPreview,
			},
			props: Object.keys(argTypes),
			template: '<MkUrlPreview v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
