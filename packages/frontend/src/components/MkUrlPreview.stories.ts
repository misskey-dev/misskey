import { Meta, Story } from '@storybook/vue3';
import MkUrlPreview from './MkUrlPreview.vue';
const meta = {
	title: 'components/MkUrlPreview',
	component: MkUrlPreview,
};
export const Default = {
	components: {
		MkUrlPreview,
	},
	template: '<MkUrlPreview />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
