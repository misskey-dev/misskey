import { Meta, Story } from '@storybook/vue3';
import upload from './upload.vue';
const meta = {
	title: 'ui/_common_/upload',
	component: upload,
};
export const Default = {
	components: {
		upload,
	},
	template: '<upload />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
