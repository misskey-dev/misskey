import { Meta, Story } from '@storybook/vue3';
import MkSparkle from './MkSparkle.vue';
const meta = {
	title: 'components/MkSparkle',
	component: MkSparkle,
};
export const Default = {
	components: {
		MkSparkle,
	},
	template: '<MkSparkle />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
