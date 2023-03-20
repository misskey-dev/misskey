import { Meta, Story } from '@storybook/vue3';
import MkEmoji from './MkEmoji.vue';
const meta = {
	title: 'components/global/MkEmoji',
	component: MkEmoji,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkEmoji,
			},
			props: Object.keys(argTypes),
			template: '<MkEmoji v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
