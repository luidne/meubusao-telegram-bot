const axios = require('axios')
const apiUrl = process.env.API_URL;

const buscarTodas = async () => {
    try {
        return await axios.get(apiUrl+`/linha`);
    } catch (error) {
        return error;
    }
}

const buscarPorCodigoOuNome = async (query) => {
    try {
        return await axios.get(encodeURI(apiUrl+`/linha/porCodigoOuNome?q=${query}`));
    } catch (error) {
        return error;
    }
}

const buscarPorIdLinha = async (codigo) => {
    try {
        return await axios.get(apiUrl+`/linha/${codigo}`);
    } catch (error) {
        return error;
    }
}

const buscarPorIdLinhaEsentido = async (idLinha, idSentido, idParada) => {
    try {
        console.log(`idLinha = ${idLinha}\tidSentido = ${idSentido}\tidParada = ${idParada}`);
        return await axios.get(apiUrl+`/horarios/${idParada}/${idLinha}/${idSentido}`);
    } catch (error) {
        return error;
    }
}

module.exports = { buscarTodas, buscarPorCodigoOuNome, buscarPorIdLinha, buscarPorIdLinhaEsentido };