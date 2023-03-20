import { Meta, Story } from '@storybook/vue3';
import MkPagePreview from './MkPagePreview.vue';
const meta = {
	title: 'components/MkPagePreview',
	component: MkPagePreview,
};
export const Default = {
	components: {
		MkPagePreview,
	},
	template: '<MkPagePreview />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
