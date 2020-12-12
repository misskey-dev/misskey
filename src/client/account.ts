import { reactive, ref } from 'vue';
import { setAccountSettings } from './account-settings';
import { apiUrl } from './config';

const data = localStorage.getItem('account');

export const i = ref(data ? JSON.parse(data) : null);

if (i.value && i.value.token) {
	fetch(i.value.token).then(data => {
		for (const [key, value] of Object.entries(data)) {
			i.value[key] = value;
		}

		setAccountSettings(data.clientData);
	});
}

export function signout() {

}

function fetch(token) {
	return new Promise((done, fail) => {
		// Fetch user
		fetch(`${apiUrl}/i`, {
			method: 'POST',
			body: JSON.stringify({
				i: token
			})
		})
		.then(res => {
			// When failed to authenticate user
			if (res.status !== 200 && res.status < 500) {
				return signout();
			}

			// Parse response
			res.json().then(i => {
				i.token = token;
				done(i);
			});
		})
		.catch(fail);
	});
}
