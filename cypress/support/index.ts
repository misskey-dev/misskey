declare global {
	namespace Cypress {
		interface Chainable {
			login(username: string, password: string): Chainable<void>;

			registerUser(
				username: string,
				password: string,
				isAdmin?: boolean
			): Chainable<void>;

			resetState(): Chainable<void>;

			visitHome(): Chainable<void>;
		}
	}
}

export {}
