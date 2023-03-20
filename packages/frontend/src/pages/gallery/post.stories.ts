import { Meta, Story } from '@storybook/vue3';
import post from './post.vue';
const meta = {
	title: 'pages/gallery/post',
	component: post,
};
export const Default = {
	components: {
		post,
	},
	template: '<post />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
