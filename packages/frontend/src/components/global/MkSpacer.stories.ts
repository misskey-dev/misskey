import { Meta, Story } from '@storybook/vue3';
import MkSpacer from './MkSpacer.vue';
const meta = {
	title: 'components/global/MkSpacer',
	component: MkSpacer,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkSpacer,
			},
			props: Object.keys(argTypes),
			template: '<MkSpacer v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
