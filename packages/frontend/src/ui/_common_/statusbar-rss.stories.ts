/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import statusbar_rss from './statusbar-rss.vue';
const meta = {
	title: 'ui/_common_/statusbar-rss',
	component: statusbar_rss,
} satisfies Meta<typeof statusbar_rss>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				statusbar_rss,
			},
			props: Object.keys(argTypes),
			template: '<statusbar_rss v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof statusbar_rss>;
export default meta;
