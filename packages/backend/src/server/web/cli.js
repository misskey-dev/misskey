'use strict';

window.onload = async () => {
	const account = JSON.parse(localStorage.getItem('account'));
	const i = account.token;

	const api = (endpoint, data = {}) => {
		const promise = new Promise((resolve, reject) => {
			// Append a credential
			if (i) data.i = i;
	
			// Send request
			fetch(endpoint.indexOf('://') > -1 ? endpoint : `/api/${endpoint}`, {
				headers: {
					'Content-Type': 'application/json'
				},
				method: 'POST',
				body: JSON.stringify(data),
				credentials: 'omit',
				cache: 'no-cache'
			}).then(async (res) => {
				const body = res.status === 204 ? null : await res.json();
	
				if (res.status === 200) {
					resolve(body);
				} else if (res.status === 204) {
					resolve();
				} else {
					reject(body.error);
				}
			}).catch(reject);
		});
		
		return promise;
	};

	document.getElementById('submit').addEventListener('click', () => {
		api('notes/create', {
			text: document.getElementById('text').value
		}).then(() => {
			location.reload();
		});
	});

	api('notes/timeline').then(notes => {
		const tl = document.getElementById('tl');
		for (const note of notes) {
			const el = document.createElement('div');
			const name = document.createElement('header');
			name.textContent = `${note.user.name} @${note.user.username}`;
			const text = document.createElement('div');
			text.textContent = `${note.text}`;
			el.appendChild(name);
			el.appendChild(text);
			tl.appendChild(el);
		}
	});
};
