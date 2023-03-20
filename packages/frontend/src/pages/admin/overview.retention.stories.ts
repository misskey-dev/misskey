import { Meta, Story } from '@storybook/vue3';
import overview_retention from './overview.retention.vue';
const meta = {
	title: 'pages/admin/overview.retention',
	component: overview_retention,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				overview_retention,
			},
			props: Object.keys(argTypes),
			template: '<overview_retention v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
