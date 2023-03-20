import { Meta, Story } from '@storybook/vue3';
import MkUrlPreviewPopup from './MkUrlPreviewPopup.vue';
const meta = {
	title: 'components/MkUrlPreviewPopup',
	component: MkUrlPreviewPopup,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUrlPreviewPopup,
			},
			props: Object.keys(argTypes),
			template: '<MkUrlPreviewPopup v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
