import { Meta, Story } from '@storybook/vue3';
import edit from './edit.vue';
const meta = {
	title: 'pages/gallery/edit',
	component: edit,
};
export const Default = {
	components: {
		edit,
	},
	template: '<edit />',
};
export default meta;
