/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import achievements_ from './achievements.vue';
const meta = {
	title: 'pages/achievements',
	component: achievements_,
} satisfies Meta<typeof achievements_>;
export const Default = {
	render(args) {
		return {
			components: {
				achievements_,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<achievements_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof achievements_>;
export default meta;
