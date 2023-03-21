/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkAchievements from './MkAchievements.vue';
const meta = {
	title: 'components/MkAchievements',
	component: MkAchievements,
} satisfies Meta<typeof MkAchievements>;
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
} satisfies StoryObj<typeof MkAchievements>;
export default meta;
