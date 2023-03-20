import { Meta, Story } from '@storybook/vue3';
import MkTooltip from './MkTooltip.vue';
const meta = {
	title: 'components/MkTooltip',
	component: MkTooltip,
};
export const Default = {
	components: {
		MkTooltip,
	},
	template: '<MkTooltip />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
