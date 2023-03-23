/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkMention from './MkMention.vue';
const meta = {
	title: 'components/MkMention',
	component: MkMention,
} satisfies Meta<typeof MkMention>;
export const Default = {
	render(args) {
		return {
			components: {
				MkMention,
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
			template: '<MkMention v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMention>;
export default meta;
