import { Meta, Story } from '@storybook/vue3';
import MkAbuseReport from './MkAbuseReport.vue';
const meta = {
	title: 'components/MkAbuseReport',
	component: MkAbuseReport,
};
export const Default = {
	components: {
		MkAbuseReport,
	},
	template: '<MkAbuseReport />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
