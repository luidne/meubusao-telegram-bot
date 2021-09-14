const { Telegraf } = require('telegraf');
const LocalSession = require('telegraf-session-local')
const api = require('./api');
const { comandos, keyboardLinks, keyboardOrgaos, keyboardSentidos } = require('./constants');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use((new LocalSession({
    storage: LocalSession.storageMemory
})).middleware());

bot.start((ctx) => {
        ctx.reply(`Olá, ${ctx.from.first_name}!\nDigite o número ou nome da linha que você quer obter os horários:`);
    }
);

// Logger
bot.use(async (ctx, next) => {
    const start = new Date();
    const message = ctx.message;
    await next();
    const ms = new Date() - start;
    console.log(`Response time: ${ms}ms. Message: ${JSON.stringify(message)}`);
  });
bot.command('ajuda', async (ctx) => {
    const comandosText = comandos.map(item => `/${item.command} - ${item.description}`)
                            .join('\n');

    return ctx.reply(`Veja se algum desses comandos abaixo te ajuda...
                        \n${comandosText}\n\nNão achou o que procura? Contate o SETURB (Sindicato das Empresas de Transporte Urbano de Palmas) `+
                        `ou a SESMU (Secretaria Municipal de Segurança e Mobilidade Urbana). `,
                        keyboardOrgaos);
});

bot.command('sobre', async (ctx) => {
    return ctx.replyWithHTML('Eu posso disponilizar a tabela de horários de uma linha baseado no código de 3 (três) dígitos que você especificar '+
                    'ou no nome que digitar a qualquer momento (pra eu encontrar a linha preciso que você digite 3 caracteres, no mínimo).\n\n'+
                    'O horário que eu te enviar corresponderá ao início de uma rota (IDA ou VOLTA começando em algum ponto de parada).\n\n'+
                    '<i>Lembre-se, eu apenas repasso os horários do SETURB. 😉</i>\n\n'+
                    'Para mas informações acesse meu site no botão abaixo ou instale meu app no seu Android',
                    keyboardLinks);
});

bot.command('todas', async (ctx) => {
    const response = await api.buscarTodas();

    if(response.status === 200 && response.data.length > 0) {
        const linhas = response.data;
        const linhasText = linhas.map(item => `${item.codigo} - ${item.nome}`)
                                    .join('\n');
        ctx.reply(`Escolha uma delas e digite o código ou o nome:\n\n${linhasText}`);
    } else {
        ctx.reply(`Eita! Tem algo estranho... Por favor, avisa meu pai @luidne`);
    }
});

bot.on('message', async (ctx, next) => {
    const message = ctx.message;
    const codigo = message.text;
    const linhasResponse = await api.buscarPorCodigoOuNome(codigo);

    if(linhasResponse.status === 200 && linhasResponse.data.length > 0) {
        const linhas = linhasResponse.data;

        // caso encontre só uma linha vai direto mostrar a opções
        if(linhas.length === 1) {
            const response = await api.buscarPorIdLinha(linhas[0].idLinha);

            if(response.status === 200 && response.data.length > 0) {
                const linhaCompleta = response.data[0];
                
                const linha = {
                    id: linhaCompleta.idLinha,
                    codigo: linhaCompleta.codigo,
                    nome: linhaCompleta.nome
                };
                const sentidos = linhaCompleta.sentidos.map(item => ({
                    id: item.sentido.idSentido,
                    nome: item.sentido.nomeSentido,
                    parada: item.paradas[0]
                }));

                ctx.session = { linha, sentidos };

                ctx.reply(`${linha.codigo} - ${linha.nome}`, keyboardSentidos);
                next();
            }
        } else {
            const linhasSugeridas = linhas.map(item => `${item.codigo} - ${item.nome}`).join('\n');
            ctx.reply(`Encontrei mais de uma linha. Escolha uma delas e digite o código:\n\n${linhasSugeridas}`);
        }
    } else {
        ctx.reply(`Me desculpe, não encontrei essa linha. Tente o comando /todas e depois digite o número.`);
    }
});

bot.action('sentido_ida', async (ctx) => {
    enviarTabelaHorarios(ctx, 1);
    ctx.deleteMessage();
});

bot.action('sentido_volta', async (ctx) => {
    enviarTabelaHorarios(ctx, 2);
    ctx.deleteMessage(); // para as opções desaparecem
});

async function enviarTabelaHorarios(ctx, idSentido) {
    try {
        const linha = ctx.session.linha;
        const sentido = ctx.session.sentidos[idSentido-1];
        const response = await api.buscarPorIdLinhaEsentido(linha.id, sentido.id, sentido.parada.idParada);
        const cabecalho = `<b>${linha.codigo} - ${linha.nome}</b>`;
        const descricao = `Horários para o sentido <i>${sentido.nome} (${sentido.parada.nome})</i>`;
        const diaUtil = `<b>DIA ÚTIL</b>\n${response.data.diaUtil.length > 0 ? response.data.diaUtil.join(' ') : 'Nenhum horário'}`;
        const sabado = `<b>SÁBADO</b>\n${response.data.sabado.length > 0 ? response.data.sabado.join(' ') : 'Nenhum horário'}`;
        const domingo = `<b>DOMINGO E FERIADO</b>\n${response.data.domingo.length > 0 ? response.data.domingo.join(' ') : 'Nenhum horário'}`;

        ctx.replyWithHTML(`${cabecalho}\n${descricao}\n\n${diaUtil}\n\n${sabado}\n\n${domingo}`);
    } catch (error) {
        console.log(error);
    }
}

if(process.env.BOT_RUNTIME === 'producao') {
    bot.telegram.setWebhook(process.env.BOT_WEBHOOK);
} else {
    bot.launch();
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
