/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { expect } from '@storybook/jest';
import { waitFor } from '@storybook/testing-library';
import { StoryObj } from '@storybook/vue3';
import MkError from './MkError.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkError,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...this.args,
					};
				},
			},
			template: '<MkError v-bind="props" />',
		};
	},
	async play({ canvasElement }) {
		await expect(canvasElement.firstElementChild).not.toBeNull();
		await waitFor(async () => expect(canvasElement.firstElementChild?.classList).not.toContain('_transition_zoom-enter-active'));
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkError>;
