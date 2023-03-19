import { Meta, Story } from '@storybook/vue3';
import index_photos from './index.photos.vue';
const meta = {
	title: 'pages/user/index.photos',
	component: index_photos,
};
export const Default = {
	components: {
		index_photos,
	},
	template: '<index_photos />',
};
export default meta;
