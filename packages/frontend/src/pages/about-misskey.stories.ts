import { Meta, Story } from '@storybook/vue3';
import about_misskey from './about-misskey.vue';
const meta = {
	title: 'pages/about-misskey',
	component: about_misskey,
};
export const Default = {
	components: {
		about_misskey,
	},
	template: '<about-misskey />',
};
export default meta;
