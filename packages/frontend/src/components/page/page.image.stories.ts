import { Meta, Story } from '@storybook/vue3';
import page_image from './page.image.vue';
const meta = {
	title: 'components/page/page.image',
	component: page_image,
};
export const Default = {
	components: {
		page_image,
	},
	template: '<page_image />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
