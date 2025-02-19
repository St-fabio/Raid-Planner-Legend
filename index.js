const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const Raid = require('./Model/Raid.class');
require('dotenv').config();

let raids = [];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // Accès aux serveurs
        GatewayIntentBits.GuildMessages, // Accès aux messages des serveurs
        GatewayIntentBits.MessageContent // Lecture du contenu des messages (doit être activé dans Discord Developer Portal)
    ]
});

// Enregistre les commandes
const commands = [
    /**
     * Commande permettant d'initialiser la création d'un raid
     */
    new SlashCommandBuilder()
        .setName('newraid')
        .setDescription('Organiser un Raid')
        .addStringOption(option => 
            option.setName('nom')
                .setDescription('Nom du raid')
                .setRequired(true) // Ce paramètre est obligatoire
        )
        .addStringOption(option => 
            option.setName('date')
                .setDescription('Date du raid')
                .setRequired(true) // Ce paramètre est obligatoire
        ),
    /**
     * Commande permettant de rejoindre un raid
     */
    new SlashCommandBuilder()
        .setName('joinraid')
        .setDescription('Rejoindre un raid')
        .addStringOption(option =>
            option.setName('nom')
                .setDescription('Nom du joueur')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('role')
                .setDescription(`Role dans l'équipe`)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('raidname')
                .setDescription(`Nom du raid à rejoindre`)
                .setRequired(true)
        ),
    /**
     * Commande permettant de définir les rôles d'un raid
     */
    new SlashCommandBuilder()
        .setName('setrole')
        .setDescription('Définie les rôle demandé par le raid')
        .addStringOption(option =>
            option.setName(`raidname`)
                .setDescription(`Nom du raid`)
        )
        .addIntegerOption(option =>
            option.setName('nbdps')
                .setDescription('Nombre de DPS dans le raid')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('nbtank')
                .setDescription('Nombre de tank dans le raid')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('nbheal')
                .setDescription('Nombre de heal dans le raid')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('nbsupport')
                .setDescription('Nombre de support dans le raid')
                .setRequired(false)
        ),
    /**
     * Commande finalisant de lancée la phase de recrutement pour le raid
     */
    new SlashCommandBuilder()
        .setName('launch')
        .setDescription(`Finalise l'organisation du RAID`)
        .addStringOption(option =>
            option.setName('raidname')
            .setDescription(`Nom du raid à supprimer`)
            .setRequired(true)
        ),
    /**
     * Commande listant les raid en phase de recrutement
     */
    new SlashCommandBuilder()
        .setName('listraid')
        .setDescription(`Liste les raid en cours d'organisation`),
    /**
     * Commande permettant de supprimer un raid
     */
    new SlashCommandBuilder()
        .setName('suppraid')
        .setDescription(`Supprime un Raid`)
        .addStringOption(option => 
            option.setName('raidname')
                .setDescription(`Nom du raid à supprimer`)
                .setRequired(true)
        )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('🔄 Enregistrement des commandes...');
        await rest.put(
            Routes.applicationCommands(process.env.BOT_ID), // Remplace par ton Application ID
            { body: commands }
        );
        console.log('✅ Commandes enregistrées avec succès !');
    } catch (error) {
        console.error('Erreur lors de l’enregistrement des commandes :', error);
    }
})();

// Envoie des messages de notfications de raids
client.on('ready', () => {
    setInterval(function () {
        if (raids.length != 0) {
            for (let i = 0; i < raids.length; i++) {
                if (raids[i].isLaunch == true) {
                    client.channels.cache.get(process.env.CHANNEL).send(`Raid : ${raids[i].raidName}, need : ${raids[i].nbDPS} DPS, ${raids[i].nbTank} Tank, ${raids[i].nbHeal} Heal, ${raids[i].nbSupport} Support`)
                        .then(sentMessage => {
                            sentMessage.react('⚔️'); 
                            sentMessage.react('🛡️'); 
                            sentMessage.react('🏥'); 
                            sentMessage.react('🍺'); 
                        }).catch(console.error);
                }
            }
        }
    }, 50000);
})

// Écoute les interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'newraid') {
        const nomRaid = interaction.options.getString('nom');
        const dateRaid = interaction.options.getString('date');

        let organisedRaid = new Raid(nomRaid, dateRaid);

        console.log(organisedRaid);

        raids.push(organisedRaid);

        await interaction.reply(`📢 Raid "${organisedRaid.raidName}" créé avec succès !`);
    } else if (interaction.commandName === 'joinraid') {
        const nomJoueur = interaction.options.getString('nom');
        const role = interaction.options.getString('role');
        const nomRaid = interaction.options.getString('raidname');

        let i = 0;
        while (i < raids.length && !raids[i].raidName === nomRaid) {
            i++;
        }

        if (i < raids.length) {
            raids[i].aRejoint(nomJoueur, role);
            console.log('Raid : ', raids[i].raidName, ', joueurs : ', raids[i].team.length);

            await interaction.reply(`📢 Raid "${nomRaid}" rejoint avec succés !`);
        } else {
            await interaction.reply(`📢 Raid "${nomRaid}" n'a put être rejoint !`);
        }
    } else if (interaction.commandName === 'setrole') {
        const nomRaid = interaction.options.getString('raidname');
        const nbdps = interaction.options.getInteger('nbdps');
        const nbtank = interaction.options.getInteger('nbtank');
        const nbheal = interaction.options.getInteger('nbtank');
        const nbsupport = interaction.options.getInteger('nbsupport');

        try {
            // Récuperer le raid
            let raid;
            let i = 0;
            while (i < raids.length && raids[i].raidName != nomRaid) {
                i++;
            }

            if (i < raids.length) {
                raid = raids[i];

                if (nbdps != null) {
                    raid.setNbDps(nbdps)
                } if (nbtank != null) {
                    raid.setNbTank(nbtank);
                } if (nbheal != null) {
                    raid.setNbHeal(nbheal);
                } if (nbsupport != null) {
                    raid.setNbSupport(nbsupport);
                }

                await interaction.reply(`📢 Raid "${nomRaid}" rôle rajouté avec succées !`);
            } else {
                await interaction.reply(`Raid : ${nomRaid} n'existe pas !!!`);   
            }
        } catch {
            await interaction.reply(`Erreur dans lee rajouts des rôles !!!`);
        }
        
    } else if (interaction.commandName === 'launch') {
        const raidname = interaction.options.getString('raidname');

        let raid;
            let i = 0;
            while (i < raids.length && raids[i].raidName != raidname) {
                i++;
            }

            if (i < raids.length) {
                raid = raids[i];

                raid.launchRaid();

                await interaction.reply(`📢 Raid "${raidname}" lancé avec succées !`);
            } else {
                await interaction.reply(`Raid : ${raidname} n'existe pas !!!`);   
            }
    } else if (interaction.commandName === 'listraid') {
        let strRaid = raids[0].raidName;

        console.log(raids.length);    

        for (let i = 1; i < raids.length; i++) {
            if (raids[i].isLaunch) {
                strRaid = strRaid.concat(', ', raids[i].raidName);
            }
        }

        await interaction.reply(`Voici les raids en cours : ${strRaid}`);  
    } else if (interaction.commandName === 'suppraid') {
        const raidname = interaction.options.getString('raidname');

        let i = 0;
        while (i < raids.length && raids[i].raidName != raidname) {
            i++;
        }

        if (i < raids.length) {
            raid = raids[i];

            raids.splice(i, 1);

            await interaction.reply(`Raid : ${raidname}, supprimé avec succée`);
        } else {
            await interaction.reply(`Raid : ${raidname} non trouvé !!!`);
        }
    }
});

client.on('ready', () => {
    console.log(`Je suis prêt !`); // On affiche un message de log dans la console (ligne de commande), lorsque le bot est démarré
});

client.on('error', console.error); // Afficher les erreurs

// Lancement du bot, avec le token spécifié (que vous avez généré précédemment)
client.login(process.env.DISCORD_TOKEN);