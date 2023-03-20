import { Meta, Story } from '@storybook/vue3';
import link from './link.vue';
const meta = {
	title: 'components/form/link',
	component: link,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				link,
			},
			props: Object.keys(argTypes),
			template: '<link v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
