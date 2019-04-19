{
	'targets': [
		{
			'target_name': 'crypto_key',
			'sources': ['src/crypto_key.cc'],
			'include_dirs': ['<!(node -e "require(\'nan\')")']
		}
	]
}
