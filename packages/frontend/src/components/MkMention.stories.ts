import { Meta, Story } from '@storybook/vue3';
import MkMention from './MkMention.vue';
const meta = {
	title: 'components/MkMention',
	component: MkMention,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMention,
			},
			props: Object.keys(argTypes),
			template: '<MkMention v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
