/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import reaction_ from './reaction.vue';
const meta = {
	title: 'pages/settings/reaction',
	component: reaction_,
} satisfies Meta<typeof reaction_>;
export const Default = {
	render(args) {
		return {
			components: {
				reaction_,
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
			template: '<reaction_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof reaction_>;
export default meta;
