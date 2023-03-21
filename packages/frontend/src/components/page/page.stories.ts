import { Meta, StoryObj } from '@storybook/vue3';
import page_ from './page.vue';
const meta = {
	title: 'components/page/page',
	component: page_,
} satisfies Meta<typeof page_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_,
			},
			props: Object.keys(argTypes),
			template: '<page_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof page_>;
export default meta;
