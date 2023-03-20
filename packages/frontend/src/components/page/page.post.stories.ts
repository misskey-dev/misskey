import { Meta, Story } from '@storybook/vue3';
import page_post from './page.post.vue';
const meta = {
	title: 'components/page/page.post',
	component: page_post,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_post,
			},
			props: Object.keys(argTypes),
			template: '<page_post v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
