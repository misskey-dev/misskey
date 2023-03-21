/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_post from './page.post.vue';
const meta = {
	title: 'components/page/page.post',
	component: page_post,
} satisfies Meta<typeof page_post>;
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
} satisfies StoryObj<typeof page_post>;
export default meta;
