import { Meta, Story } from '@storybook/vue3';
import classic_header from './classic.header.vue';
const meta = {
	title: 'ui/classic.header',
	component: classic_header,
};
export const Default = {
	components: {
		classic_header,
	},
	template: '<classic.header />',
};
export default meta;
