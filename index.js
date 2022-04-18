import dotenv from 'dotenv';
dotenv.config();

import Yaris from 'yaris-wrapper';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import { Client } from 'discord.js'
const client = new Client({
    intents: ['GUILDS', 'DIRECT_MESSAGES', 'GUILD_MESSAGES', 'GUILD_MEMBERS'],
    partials: ['MESSAGE', 'CHANNEL']
});
const yaris = new Yaris(process.env.YARIS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DiscordAllowed = { '900807147514904586': true, '422587947972427777': true }

let dServer;

async function validUUID(uuid) {
    if (!uuid) return false;
    return await dServer.members.fetch(uuid.toString().trim()).then(() => {
        return uuid.toString().trim()
    }).catch(() => {
        return false
    });
}
function getHWID(req) {
    const headers = ["Syn-Fingerprint", "Krnl-Hwid", "syn-fingerprint", "SW-Fingerprint"];
    for (let i = 0; i < headers.length; i++) {
        if (req.headers[headers[i]]) {
            return req.headers[headers[i]];
        }
    }
}

const app = express();
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.get('/', (req, res) => {
    res.send('ReaperOnTop');
})
app.post('/add', async (req, res) => {
    const hwid = getHWID(req)
    const uuid = await validUUID(req.body.uuid)
    const key = req.body.key

    if (!hwid) return res.send({ error: 'unsupported exploit' })
    if (!key) return res.send({ error: 'no key provided' })
    if (!uuid) return res.send({ error: 'invalid uuid' })

    yaris.removeKey(key).then(info => {
        if (info && info.success) {
            yaris.addUser({
                tag: uuid,
                data: hwid,
                expires: '',
                role: 'Buyer'
            }).then(info => {
                if (info && info.success) {
                    res.send({ message: 'successfully whitelisted.' })
                } else return res.send({ error: 'yaris broke idk' })
            })
        } else return res.send({ error: 'invalid key' })
    })
})
app.listen(process.env.PORT)

const discord_commands = {
    ping: (msg) => {
        msg.reply('No')
    },
    generateKey: (msg, args) => {
        if (!DiscordAllowed[msg.author.id]) return msg.reply('Unauthorized.');
        const uuid = args && args[0] || '';

        yaris.addKey().then(info => {
            if (info && info.success) {
                const key = info.additional.key
                const script = '```lua' + `\nloadstring(game:HttpGet("https://reaperhub.herokuapp.com/whitelist.lua", true))("` + key + `", "` + uuid + `")\n` + '```'

                msg.channel.send(script)
            } else {
                msg.channel.send('Failed to generate key error: ' + info.error.message)
            };
        });
    },
    removeKey: (msg, args) => {
        if (!DiscordAllowed[msg.author.id]) return msg.reply('Unauthorized.');
        if (!args || args.length < 1) return msg.reply('Invalid arguments.');

        yaris.removeKey(args[0]).then(info => {
            if (info && info.success) {
                msg.channel.send('Successfully removed key.')
            } else {
                msg.channel.send('Failed to remove key, error: ' + info.error.message)
            };
        })
    },
    removeUser: (msg, args) => {
        if (!DiscordAllowed[msg.author.id]) return msg.reply('Unauthorized.');
        if (!args || args.length < 3) return msg.reply('Invalid arguments.');

        const [method, data, hashed] = [...args]
        if (method == 'tag') {
            yaris.removeUser({ tag: data }).then(info => {
                if (info && info.success) {
                    msg.channel.send('Successfully removed user.')
                } else {
                    msg.channel.send('Failed to remove user, error: ' + info.error.message)
                };
            })
        } else if (method == 'hwid') {
            const push = {
                data: data,
            }
            if (hashed && hashed.lower() == 'true') {
                push.hashed = true
            } else {
                push.hashed = false
            }
            yaris.removeUser(push).then(info => {
                if (info && info.success) {
                    msg.channel.send('Successfully removed user.')
                } else {
                    msg.channel.send('Failed to remove user, error: ' + info.error.message)
                }
            })
        } else {
            msg.reply('Invalid method.')
        }
    },
    whitelistUser: (msg, args) => {
        if (!DiscordAllowed[msg.author.id]) return msg.reply('Unauthorized.');
        if (!args || args.length < 2) return msg.reply('Invalid arguments.');

        const [hashed, data] = [...args]
        if (hashed && hashed.lower() == 'true') {
            yaris.whitelistUser({
                data: data,
                hashed: true
            }).then(info => {
                if (info && info.success) {
                    msg.channel.send('Successfully whitelisted user.')
                } else {
                    msg.channel.send('Failed to whitelist user, error: ' + info.error.message)
                };
            })
        } else {
            yaris.whitelistUser({
                data: data,
                hashed: false
            }).then(info => {
                if (info && info.success) {
                    msg.channel.send('Successfully whitelisted user.')
                } else {
                    msg.channel.send('Failed to whitelist user, error: ' + info.error.message)
                };
            })
        }
    },
    blacklistUser: (msg, args) => {
        if (!DiscordAllowed[msg.author.id]) return msg.reply('Unauthorized.');
        if (!args || args.length < 2) return msg.reply('Invalid arguments.');

        const [hashed, data] = [...args]
        if (hashed && hashed.lower() == 'true') {
            yaris.blacklistUser({
                data: data,
                hashed: true
            }).then(info => {
                if (info && info.success) {
                    msg.channel.send('Successfully blacklisted user.')
                } else {
                    msg.channel.send('Failed to blacklist user, error: ' + info.error.message)
                };
            })
        } else {
            yaris.blacklistUser({
                data: data,
                hashed: false
            }).then(info => {
                if (info && info.success) {
                    msg.channel.send('Successfully blacklisted user.')
                } else {
                    msg.channel.send('Failed to blacklist user, error: ' + info.error.message)
                };
            })
        }
    }
}

client.on('ready', () => {
    console.log('ReaperOnTop')

    dServer = client.guilds.cache.get('900812818947907614')
})

client.on('messageCreate', (msg) => {
    if (msg.author.bot) return;
    const content = msg.content;
    if (content.startsWith(process.env.PREFIX)) {
        const [name, ...messages] = content.trim().substring(process.env.PREFIX.length).split(" ");
        const args = [msg]
        if (messages.length > 0) args.push(messages);
        if (discord_commands[name]) discord_commands[name](...args);
    }
})

client.login(process.env.DISCORD_TOKEN)