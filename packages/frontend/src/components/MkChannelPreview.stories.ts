import { Meta, Story } from '@storybook/vue3';
import MkChannelPreview from './MkChannelPreview.vue';
const meta = {
	title: 'components/MkChannelPreview',
	component: MkChannelPreview,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkChannelPreview,
			},
			props: Object.keys(argTypes),
			template: '<MkChannelPreview v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
