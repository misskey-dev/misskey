/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_section from './page.section.vue';
const meta = {
	title: 'components/page/page.section',
	component: page_section,
} satisfies Meta<typeof page_section>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_section,
			},
			props: Object.keys(argTypes),
			template: '<page_section v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof page_section>;
export default meta;
