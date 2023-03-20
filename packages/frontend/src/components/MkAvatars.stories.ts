import { Meta, Story } from '@storybook/vue3';
import MkAvatars from './MkAvatars.vue';
const meta = {
	title: 'components/MkAvatars',
	component: MkAvatars,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkAvatars,
			},
			props: Object.keys(argTypes),
			template: '<MkAvatars v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
