import { Meta, Story } from '@storybook/vue3';
import post from './post.vue';
const meta = {
	title: 'pages/gallery/post',
	component: post,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				post,
			},
			props: Object.keys(argTypes),
			template: '<post v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
