import { Meta, Story } from '@storybook/vue3';
import MkUserPopup from './MkUserPopup.vue';
const meta = {
	title: 'components/MkUserPopup',
	component: MkUserPopup,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUserPopup,
			},
			props: Object.keys(argTypes),
			template: '<MkUserPopup v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
