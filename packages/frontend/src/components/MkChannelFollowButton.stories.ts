/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkChannelFollowButton from './MkChannelFollowButton.vue';
const meta = {
	title: 'components/MkChannelFollowButton',
	component: MkChannelFollowButton,
} satisfies Meta<typeof MkChannelFollowButton>;
export const Default = {
	render(args) {
		return {
			components: {
				MkChannelFollowButton,
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
			template: '<MkChannelFollowButton v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkChannelFollowButton>;
export default meta;
