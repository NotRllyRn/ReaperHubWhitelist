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
                role: 'user'
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
    generateKey: async function (msg, args) {
        if (!DiscordAllowed[msg.author.id]) return msg.reply('Unauthorized.');
        const uuid = args[0] || '';

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
}

client.on('ready', () => {
    console.log('ReaperOnTop')
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