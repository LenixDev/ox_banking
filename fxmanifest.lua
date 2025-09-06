name 'ox_banking'
author 'Overextended'
version '1.0.7'
license 'MIT'
repository 'https://github.com/communityox/ox_banking.git'
description 'Banking system for ox_core'
fx_version 'cerulean'
game 'gta5'
ui_page 'dist/web/index.html'
lua54 'yes'

files {
	'core/lib/init.lua',
	'core/lib/client/**.lua',
	'core/locales/*.json',
	'core/common/data/*.json',
	'dist/web/index.html',
	'dist/web/script.js',
	'dist/web/styles.css',
	'data/atms.json',
	'data/banks.json',
	'data/config.json',
	'locales/*.json',
}

dependencies {
	'/server:12913',
	'/onesync',
	'ox_lib',
	'oxmysql',
	'ox_inventory',
}

client_scripts {
	'@ox_lib/init.lua',
	'core/dist/client.js',
	'src/client/client.lua',
	'dist/client.js',
}

server_scripts {
	'@oxmysql/lib/MySQL.lua',
	'core/dist/server.js',
	'dist/server.js',
}
