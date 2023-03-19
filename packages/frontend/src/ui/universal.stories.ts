import { Meta, Story } from '@storybook/vue3';
import universal from './universal.vue';
const meta = {
	title: 'ui/universal',
	component: universal,
};
export const Default = {
	components: {
		universal,
	},
	template: '<universal />',
};
export default meta;
