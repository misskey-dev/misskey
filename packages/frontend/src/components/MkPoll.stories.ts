/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkPoll from './MkPoll.vue';
const meta = {
	title: 'components/MkPoll',
	component: MkPoll,
} satisfies Meta<typeof MkPoll>;
export const Default = {
	render(args) {
		return {
			components: {
				MkPoll,
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
			template: '<MkPoll v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPoll>;
export default meta;
