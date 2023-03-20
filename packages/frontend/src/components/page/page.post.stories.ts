import { Meta, Story } from '@storybook/vue3';
import page_post from './page.post.vue';
const meta = {
	title: 'components/page/page.post',
	component: page_post,
};
export const Default = {
	components: {
		page_post,
	},
	template: '<page_post />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
