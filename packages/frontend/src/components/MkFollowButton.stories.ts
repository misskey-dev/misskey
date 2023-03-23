/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkFollowButton from './MkFollowButton.vue';
const meta = {
	title: 'components/MkFollowButton',
	component: MkFollowButton,
} satisfies Meta<typeof MkFollowButton>;
export const Default = {
	render(args) {
		return {
			components: {
				MkFollowButton,
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
			template: '<MkFollowButton v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkFollowButton>;
export default meta;
