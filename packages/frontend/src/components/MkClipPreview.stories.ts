import { Meta, Story } from '@storybook/vue3';
import MkClipPreview from './MkClipPreview.vue';
const meta = {
	title: 'components/MkClipPreview',
	component: MkClipPreview,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkClipPreview,
			},
			props: Object.keys(argTypes),
			template: '<MkClipPreview v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
