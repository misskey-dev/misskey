import { Meta, Story } from '@storybook/vue3';
import MkAbuseReportWindow from './MkAbuseReportWindow.vue';
const meta = {
	title: 'components/MkAbuseReportWindow',
	component: MkAbuseReportWindow,
};
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
};
export default meta;
