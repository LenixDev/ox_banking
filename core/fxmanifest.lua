name '@communityox/ox_core'
author 'Overextended'
version '1.5.8'
license 'LGPL-3.0-or-later'
repository 'https://github.com/communityox/ox_core.git'
description 'A modern FiveM framework.'
fx_version 'cerulean'
game 'gta5'
node_version '22'

files {
	'lib/init.lua',
	'lib/client/**.lua',
	'locales/*.json',
	'common/data/*.json',
}

dependencies {
	'/server:12913',
	'/onesync',
}

client_scripts {
	'dist/client.js',
}

server_scripts {
	'dist/server.js',
}
