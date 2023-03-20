import { Meta, Story } from '@storybook/vue3';
import MkUrlPreviewPopup from './MkUrlPreviewPopup.vue';
const meta = {
	title: 'components/MkUrlPreviewPopup',
	component: MkUrlPreviewPopup,
};
export const Default = {
	components: {
		MkUrlPreviewPopup,
	},
	template: '<MkUrlPreviewPopup />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
