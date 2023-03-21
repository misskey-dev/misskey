/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkAbuseReportWindow from './MkAbuseReportWindow.vue';
const meta = {
	title: 'components/MkAbuseReportWindow',
	component: MkAbuseReportWindow,
} satisfies Meta<typeof MkAbuseReportWindow>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkAbuseReportWindow,
			},
			props: Object.keys(argTypes),
			template: '<MkAbuseReportWindow v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkAbuseReportWindow>;
export default meta;
