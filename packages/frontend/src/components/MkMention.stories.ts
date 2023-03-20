import { Meta, Story } from '@storybook/vue3';
import MkMention from './MkMention.vue';
const meta = {
	title: 'components/MkMention',
	component: MkMention,
};
export const Default = {
	components: {
		MkMention,
	},
	template: '<MkMention />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
