import { Meta, Story } from '@storybook/vue3';
import MkAchievements from './MkAchievements.vue';
const meta = {
	title: 'components/MkAchievements',
	component: MkAchievements,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkAchievements,
			},
			props: Object.keys(argTypes),
			template: '<MkAchievements v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
