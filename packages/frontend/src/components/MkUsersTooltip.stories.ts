import { Meta, Story } from '@storybook/vue3';
import MkUsersTooltip from './MkUsersTooltip.vue';
const meta = {
	title: 'components/MkUsersTooltip',
	component: MkUsersTooltip,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUsersTooltip,
			},
			props: Object.keys(argTypes),
			template: '<MkUsersTooltip v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
