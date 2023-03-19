import { Meta, Story } from '@storybook/vue3';
import MkImageViewer from './MkImageViewer.vue';
const meta = {
	title: 'components/MkImageViewer',
	component: MkImageViewer,
};
export const Default = {
	components: {
		MkImageViewer,
	},
	template: '<MkImageViewer />',
};
export default meta;
