const { Markup } = require('telegraf');

const keyboardSentidos = Markup.inlineKeyboard([
        Markup.button.callback('IDA', 'sentido_ida'),
        Markup.button.callback('VOLTA', 'sentido_volta')
    ]);

const keyboardOrgaos = Markup.inlineKeyboard([
    Markup.button.url('SETURB', 'https://seturb.com.br/'),
    Markup.button.url('SESMU', 'https://www.palmas.to.gov.br/secretaria/transporte/')
  ]);

const keyboardLinks = Markup.inlineKeyboard([
    Markup.button.url('Meu site', 'https://meubusao.com.br'),
    Markup.button.url('Play Store', 'https://play.google.com/store/apps/details?id=br.com.meubusao')
]);

const comandos = [
    {
        command: "todas",
        description: "Te mostro todas as linhas disponíveis."
    },
    {
        command: "ajuda",
        description: "Precisa de uma mãozinha?"
    },
    {
        command: "sobre",
        description: "Quem sou eu?"
    }
];

module.exports = { comandos, keyboardSentidos, keyboardOrgaos, keyboardLinks }