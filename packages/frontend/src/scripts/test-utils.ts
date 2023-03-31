/// <reference types="@testing-library/jest-dom"/>

export async function tick(): Promise<void> {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	await new Promise((globalThis.requestIdleCallback ?? setTimeout) as never);
}
