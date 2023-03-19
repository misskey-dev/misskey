import { Meta, Story } from '@storybook/vue3';
import object_storage from './object-storage.vue';
const meta = {
	title: 'pages/admin/object-storage',
	component: object_storage,
};
export const Default = {
	components: {
		object_storage,
	},
	template: '<object-storage />',
};
export default meta;
