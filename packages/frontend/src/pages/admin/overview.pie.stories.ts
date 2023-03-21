/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import overview_pie from './overview.pie.vue';
const meta = {
	title: 'pages/admin/overview.pie',
	component: overview_pie,
} satisfies Meta<typeof overview_pie>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				overview_pie,
			},
			props: Object.keys(argTypes),
			template: '<overview_pie v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof overview_pie>;
export default meta;
