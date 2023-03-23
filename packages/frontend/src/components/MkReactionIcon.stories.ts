/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkReactionIcon from './MkReactionIcon.vue';
const meta = {
	title: 'components/MkReactionIcon',
	component: MkReactionIcon,
} satisfies Meta<typeof MkReactionIcon>;
export const Default = {
	render(args) {
		return {
			components: {
				MkReactionIcon,
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
			template: '<MkReactionIcon v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkReactionIcon>;
export default meta;
