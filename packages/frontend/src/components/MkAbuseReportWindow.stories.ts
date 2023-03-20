import { Meta, Story } from '@storybook/vue3';
import MkAbuseReportWindow from './MkAbuseReportWindow.vue';
const meta = {
	title: 'components/MkAbuseReportWindow',
	component: MkAbuseReportWindow,
};
export const Default = {
	components: {
		MkAbuseReportWindow,
	},
	template: '<MkAbuseReportWindow />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
