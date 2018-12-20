var user = {
	user: 'example-misskey-user',
	pwd: 'example-misskey-pass',
	roles: [
	    {
		    role: 'readWrite',
		    db: 'misskey'
	    }
	]
};

db.createUser(user);

