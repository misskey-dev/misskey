import { Meta, Story } from '@storybook/vue3';
import overview_instances from './overview.instances.vue';
const meta = {
	title: 'pages/admin/overview.instances',
	component: overview_instances,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				overview_instances,
			},
			props: Object.keys(argTypes),
			template: '<overview_instances v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
