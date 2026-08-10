const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const { exec } = require("child_process");

const app = express();

app.use(cors());
app.use(express.json());

const PORTA = 3000;


// ==========================================
// CONEXÃO COM BANCO DE DADOS
// ==========================================

const db = mysql.createConnection({

    host: "benserverplex.ddns.net",
    user: "aluno_projetos",
    password: "aluno@projeto",
    database: "aluno_projetos_glidia"

});

db.connect((erro)=>{

    if(erro){

        console.log(
            "Erro ao conectar banco:",
            erro
        );

        return;

    }

    console.log(
        "Banco conectado com sucesso!"
    );

});


// ==========================================
// ABRIR UBER
// ==========================================

function abrirUber(){

    console.log(
        "Abrindo Uber no Chrome..."
    );

    exec(

        'start chrome "https://m.uber.com/"',

        (erro)=>{

            if(erro){

                console.log(
                    "Erro ao abrir Uber:",
                    erro
                );

            }

        }

    );

}


// ==========================================
// ABRIR GPS
// ==========================================

function abrirGPS(){

    console.log(
        "Abrindo GPS no Chrome..."
    );

    exec(

        'start chrome "https://www.google.com/maps"',

        (erro)=>{

            if(erro){

                console.log(
                    "Erro ao abrir Chrome:",
                    erro
                );

            }

        }

    );

}


// ==========================================
// ESTADOS DA GLIDIA
// ==========================================

const ESTADOS = {

    MENU: "menu",

    CONFIRMAR_UBER: "confirmar_uber",

    CONFIRMAR_GPS: "confirmar_gps",

    CRIAR_NOME: "criar_nome",

    CRIAR_DATA: "criar_data",

    CRIAR_HORA: "criar_hora",

    APAGAR_LEMBRETE: "apagar_lembrete"

};

let estado = ESTADOS.MENU;


// ==========================================
// DADOS DO LEMBRETE
// ==========================================

let lembreteAtual = {

    nome: "",

    data: "",

    hora: ""

};
// ==========================================
// RESPOSTA PARA O FRONT
// ==========================================

function responder(texto){

    return {

        resposta: texto

    };

}


// ==========================================
// RESETAR CONVERSA
// ==========================================

function resetar(){

    estado = ESTADOS.MENU;

    lembreteAtual.nome = "";

    lembreteAtual.data = "";

    lembreteAtual.hora = "";

}


// ==========================================
// CONVERTER DATA
// ==========================================

function converterData(texto){

    const data = texto.match(/\d{1,2}\/\d{1,2}\/\d{4}/);

    if(!data){

        return null;

    }

    const partes = data[0].split("/");

    const dia = partes[0].padStart(2,"0");

    const mes = partes[1].padStart(2,"0");

    const ano = partes[2];

    return ano + "-" + mes + "-" + dia;

}


// ==========================================
// CONVERTER HORA
// ==========================================

function converterHora(texto){

    texto = texto

        .replace("horas","")

        .replace("hora","")

        .replace("às","")

        .replace("as","")

        .trim();


    const hora = texto.match(/\d{1,2}(:\d{2})?/);

    if(!hora){

        return null;

    }

    let resultado = hora[0];

    if(!resultado.includes(":")){

        resultado += ":00";

    }

    return resultado.padStart(5,"0");

}
// ==========================================
// SALVAR LEMBRETE NO BANCO
// ==========================================

function salvarLembrete(callback){

    const sql = `
        INSERT INTO lembretes
        (nome, data, hora)
        VALUES (?, ?, ?)
    `;

    db.query(

        sql,

        [
            lembreteAtual.nome,
            lembreteAtual.data,
            lembreteAtual.hora
        ],

        (erro)=>{

            if(erro){

                console.log(
                    "Erro ao salvar:",
                    erro
                );

                callback(false);
                return;

            }

            console.log("==============================");
            console.log("LEMBRETE SALVO");
            console.log(lembreteAtual);
            console.log("==============================");

            callback(true);

        }

    );

}


// ==========================================
// LIMPAR NOME PARA BUSCAS
// ==========================================

function limparNome(texto){

    return texto

        .toLowerCase()

        .replace(/[?.,!]/g,"")

        .replace("o lembrete","")

        .replace("lembrete","")

        .replace("de ","")

        .replace("do ","")

        .replace("da ","")

        .replace("quero ","")

        .replace("apagar ","")

        .replace("excluir ","")

        .replace("remover ","")

        .trim();

}


// ==========================================
// CONFIRMOU
// ==========================================

function confirmou(texto){

    texto = texto.toLowerCase();

    return (

        texto.includes("sim") ||

        texto.includes("pode") ||

        texto.includes("ok") ||

        texto.includes("confirmo")

    );

}


// ==========================================
// CANCELOU
// ==========================================

function cancelou(texto){

    texto = texto.toLowerCase();

    return (

        texto.includes("não") ||

        texto.includes("nao") ||

        texto.includes("cancelar")

    );

}


// ==========================================
// QUER APAGAR
// ==========================================

function querApagar(texto){

    texto = texto.toLowerCase();

    return (

        texto.includes("apagar") ||

        texto.includes("apague") ||

        texto.includes("excluir") ||

        texto.includes("remover") ||

        texto.includes("cancelar lembrete")

    );

}
// ==========================================
// EXCLUIR LEMBRETE PELO NOME
// ==========================================

function excluirLembrete(nome, callback){

    nome = limparNome(nome);

    console.log(
        "Buscando para apagar:",
        nome
    );

    const sql = `
        DELETE FROM lembretes
        WHERE nome LIKE ?
    `;

    db.query(

        sql,

        [
            "%" + nome + "%"
        ],

        (erro, resultado)=>{

            if(erro){

                console.log(
                    "Erro ao apagar:",
                    erro
                );

                callback(false);
                return;

            }

            callback(
                resultado.affectedRows > 0
            );

        }

    );

}


// ==========================================
// LIMPAR NOME DO LEMBRETE NA CRIAÇÃO
// ==========================================

function limparNomeCriacao(texto){

    return texto

        .toLowerCase()

        .replace("criar lembrete","")

        .replace("criando lembrete","")

        .replace("novo lembrete","")

        .replace("lembrete","")

        .replace("de ","")

        .replace("?","")

        .trim();

}
// ==========================================
// RECEBER COMANDOS
// ==========================================

app.post("/comando", (req, res) => {

    const comando = req.body.comando
        .toLowerCase()
        .trim();

    console.log("==================================");
    console.log("Pessoa:", comando);
    console.log("Estado atual:", estado);
    console.log("==================================");


    // ==========================================
    // CANCELAR QUALQUER OPERAÇÃO
    // ==========================================

    if (
        comando.includes("cancelar") ||
        comando.includes("cancela") ||
        comando.includes("cancele")
    ) {

        resetar();

        return res.json(
            responder(
                "Tudo bem. Operação cancelada."
            )
        );

    }


    // ==========================================
    // CONFIRMAÇÃO DO UBER
    // ==========================================

    if (estado === ESTADOS.CONFIRMAR_UBER) {

        if (confirmou(comando)) {

            abrirUber();

            resetar();

            return res.json(
                responder(
                    "Abrindo Uber."
                )
            );

        }

        if (cancelou(comando)) {

            resetar();

            return res.json(
                responder(
                    "Tudo bem. Uber cancelado."
                )
            );

        }

        return res.json(
            responder(
                "Responda apenas sim ou não."
            )
        );

    }


    // ==========================================
    // CONFIRMAÇÃO DO GPS
    // ==========================================

    if (estado === ESTADOS.CONFIRMAR_GPS) {

        if (confirmou(comando)) {

            abrirGPS();

            resetar();

            return res.json(
                responder(
                    "Abrindo GPS."
                )
            );

        }

        if (cancelou(comando)) {

            resetar();

            return res.json(
                responder(
                    "Tudo bem. GPS cancelado."
                )
            );

        }

        return res.json(
            responder(
                "Responda apenas sim ou não."
            )
        );

    }


    // ==========================================
    // APAGAR LEMBRETE
    // ==========================================

    if (estado === ESTADOS.APAGAR_LEMBRETE) {

        excluirLembrete(comando, (sucesso) => {

            resetar();

            if (sucesso) {

                return res.json(
                    responder(
                        "Pronto. O lembrete foi apagado."
                    )
                );

            }

            return res.json(
                responder(
                    "Não encontrei esse lembrete."
                )
            );

        });

        return;

    }
        // ==========================================
    // CRIAR LEMBRETE - NOME
    // ==========================================

    if (estado === ESTADOS.CRIAR_NOME) {

        lembreteAtual.nome = limparNomeCriacao(comando);

        estado = ESTADOS.CRIAR_DATA;

        return res.json(
            responder(
                "Qual é a data?"
            )
        );

    }


    // ==========================================
    // CRIAR LEMBRETE - DATA
    // ==========================================

    if (estado === ESTADOS.CRIAR_DATA) {

        const data = converterData(comando);

        if (!data) {

            return res.json(
                responder(
                    "Não consegui entender a data."
                )
            );

        }

        lembreteAtual.data = data;

        estado = ESTADOS.CRIAR_HORA;

        return res.json(
            responder(
                "Qual é o horário?"
            )
        );

    }


    // ==========================================
    // CRIAR LEMBRETE - HORA
    // ==========================================

    if (estado === ESTADOS.CRIAR_HORA) {

        const hora = converterHora(comando);

        if (!hora) {

            return res.json(
                responder(
                    "Não consegui entender o horário."
                )
            );

        }

        lembreteAtual.hora = hora;

        salvarLembrete((sucesso) => {

            resetar();

            if (sucesso) {

                return res.json(
                    responder(
                        "Pronto. Lembrete criado e salvo."
                    )
                );

            }

            return res.json(
                responder(
                    "Não consegui salvar o lembrete."
                )
            );

        });

        return;

    }
        // ==========================================
    // MENU PRINCIPAL
    // ==========================================

    if (estado === ESTADOS.MENU) {

        // --------------------------
        // UBER
        // --------------------------

        if (
            comando.includes("uber")
        ) {

            estado = ESTADOS.CONFIRMAR_UBER;

            return res.json(
                responder(
                    "Você quer que eu abra o Uber?"
                )
            );

        }


        // --------------------------
        // GPS
        // --------------------------

        if (
            comando.includes("gps") ||
            comando.includes("mapa") ||
            comando.includes("localização") ||
            comando.includes("localizacao")
        ) {

            estado = ESTADOS.CONFIRMAR_GPS;

            return res.json(
                responder(
                    "Você quer que eu abra o GPS?"
                )
            );

        }


        // --------------------------
        // CRIAR LEMBRETE
        // --------------------------

        if (
            comando.includes("criar") ||
            comando.includes("crie") ||
            comando.includes("novo lembrete") ||
            comando.includes("adicionar lembrete")
        ) {

            estado = ESTADOS.CRIAR_NOME;

            return res.json(
                responder(
                    "Claro. Qual é o compromisso?"
                )
            );

        }


        // --------------------------
        // APAGAR LEMBRETE
        // --------------------------

        if (querApagar(comando)) {

            estado = ESTADOS.APAGAR_LEMBRETE;

            return res.json(
                responder(
                    "Qual lembrete você deseja apagar?"
                )
            );

        }

    }


    // ==========================================
    // COMANDO DESCONHECIDO
    // ==========================================

    return res.json(

        responder(
            "Desculpe, não entendi esse comando."
        )

    );

});
// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORTA, () => {

    console.log("==================================");
    console.log(" GLIDIA INICIADA ");
    console.log("==================================");
    console.log(" Porta:", PORTA);
    console.log(" API: http://localhost:" + PORTA);
    console.log(" Banco conectado.");
    console.log("==================================");

});