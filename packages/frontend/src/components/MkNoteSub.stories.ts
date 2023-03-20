import { Meta, Story } from '@storybook/vue3';
import MkNoteSub from './MkNoteSub.vue';
const meta = {
	title: 'components/MkNoteSub',
	component: MkNoteSub,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkNoteSub,
			},
			props: Object.keys(argTypes),
			template: '<MkNoteSub v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
