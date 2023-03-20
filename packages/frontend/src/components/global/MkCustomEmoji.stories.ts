import { Meta, Story } from '@storybook/vue3';
import MkCustomEmoji from './MkCustomEmoji.vue';
const meta = {
	title: 'components/global/MkCustomEmoji',
	component: MkCustomEmoji,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkCustomEmoji,
			},
			props: Object.keys(argTypes),
			template: '<MkCustomEmoji v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
