import { Meta, Story } from '@storybook/vue3';
import common from './common.vue';
const meta = {
	title: 'ui/_common_/common',
	component: common,
};
export const Default = {
	components: {
		common,
	},
	template: '<common />',
};
export default meta;
