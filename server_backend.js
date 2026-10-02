const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const { exec } = require("child_process");

const app = express();

app.use(cors());
app.use(express.json());

const PORTA = 3000;

const db = mysql.createConnection({
host: "benserverplex.ddns.net",
user: "alunos",
password: "senhaAlunos",
database: "aluno_projetos_glidia"
});

db.connect((erro) => {
if (erro) {
console.log("Erro ao conectar banco:", erro);
return;
}


console.log("Banco conectado com sucesso!");


});

function abrirUber() {
console.log("Abrindo Uber no Chrome...");


exec(
    'start chrome "https://m.uber.com/"',
    (erro) => {
        if (erro) {
            console.log("Erro ao abrir Uber:", erro);
        }
    }
);


}

function abrirGPS() {
console.log("Abrindo GPS no Chrome...");


exec(
    'start chrome "https://www.google.com/maps"',
    (erro) => {
        if (erro) {
            console.log("Erro ao abrir Chrome:", erro);
        }
    }
);


}

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

let lembreteAtual = {
nome: "",
data: "",
hora: ""
};

const lembretesAvisados = new Set();

function responder(texto) {
return {
resposta: texto
};
}

function resetar() {
estado = ESTADOS.MENU;


lembreteAtual = {
    nome: "",
    data: "",
    hora: ""
};


}

function normalizarTexto(texto) {
return texto
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.replace(/[?!.,;:]/g, "")
.replace(/\s+/g, " ")
.trim();
}

function converterData(texto) {
texto = normalizarTexto(texto);


const data = texto.match(
    /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/
);

if (!data) {
    return null;
}

const dia = parseInt(data[1], 10);
const mes = parseInt(data[2], 10);
const ano = parseInt(data[3], 10);

if (dia < 1 || dia > 31 || mes < 1 || mes > 12) {
    return null;
}

const dataTeste = new Date(ano, mes - 1, dia);

if (
    dataTeste.getFullYear() !== ano ||
    dataTeste.getMonth() !== mes - 1 ||
    dataTeste.getDate() !== dia
) {
    return null;
}

return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;


}

function converterHora(texto) {
texto = normalizarTexto(texto);


texto = texto
    .replace(/da noite/g, "")
    .replace(/de noite/g, "")
    .replace(/da tarde/g, "")
    .replace(/de tarde/g, "")
    .replace(/da manha/g, "")
    .replace(/de manha/g, "")
    .replace(/horas/g, "")
    .replace(/hora/g, "")
    .replace(/\bas\b/g, "")
    .replace(/\bhs\b/g, "")
    .trim();

let horaEncontrada = texto.match(
    /\b(\d{1,2})[:h](\d{2})\b/
);

if (!horaEncontrada) {
    horaEncontrada = texto.match(
        /\b(\d{1,2})\s+e\s+(\d{2})\b/
    );
}

if (!horaEncontrada) {
    horaEncontrada = texto.match(
        /\b(\d{1,2})\b/
    );
}

if (!horaEncontrada) {
    return null;
}

let horas = parseInt(horaEncontrada[1], 10);

let minutos = horaEncontrada[2]
    ? parseInt(horaEncontrada[2], 10)
    : 0;

if (horas > 23 || minutos > 59) {
    return null;
}

return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;


}

function salvarLembrete(callback) {
const sql = `         INSERT INTO lembretes1
        (nome, data, hora, lembrar_em)
        VALUES (?, ?, ?, ?)
    `;


let lembrarEm = null;

if (lembreteAtual.data && lembreteAtual.hora) {
    lembrarEm = `${lembreteAtual.data} ${lembreteAtual.hora}:00`;
}

db.query(
    sql,
    [
        lembreteAtual.nome,
        lembreteAtual.data,
        lembreteAtual.hora,
        lembrarEm
    ],
    (erro, resultado) => {
        if (erro) {
            console.log("Erro ao salvar lembrete:", erro);
            callback(false);
            return;
        }

        console.log("==================================");
        console.log("LEMBRETE SALVO");
        console.log("ID:", resultado.insertId);
        console.log("Nome:", lembreteAtual.nome);
        console.log("Data:", lembreteAtual.data);
        console.log("Hora:", lembreteAtual.hora);
        console.log("Lembrar em:", lembrarEm);
        console.log("==================================");

        callback(true);
    }
);


}

function limparNomeCriacao(texto) {
let nome = normalizarTexto(texto);


const partesParaRemover = [
    "criar lembrete",
    "criando lembrete",
    "crie um lembrete",
    "crie lembrete",
    "novo lembrete",
    "adicionar lembrete",
    "adicione lembrete",
    "lembrete"
];

for (const parte of partesParaRemover) {
    nome = nome.replace(parte, "");
}

nome = nome
    .replace(/^de /, "")
    .replace(/^para /, "")
    .replace(/^um /, "")
    .trim();

return nome;


}

function limparNomeApagar(texto) {
let nome = normalizarTexto(texto);


const partesParaRemover = [
    "apagar lembrete",
    "apague lembrete",
    "apagar o lembrete",
    "apague o lembrete",
    "excluir lembrete",
    "exclua lembrete",
    "remover lembrete",
    "remova lembrete",
    "cancelar lembrete",
    "cancele lembrete",
    "lembrete"
];

for (const parte of partesParaRemover) {
    nome = nome.replace(parte, "");
}

nome = nome
    .replace(/^de /, "")
    .replace(/^do /, "")
    .replace(/^da /, "")
    .replace(/^o /, "")
    .trim();

return nome;


}

function confirmou(texto) {
texto = normalizarTexto(texto);


return (
    texto === "sim" ||
    texto === "sim pode" ||
    texto === "pode" ||
    texto === "ok" ||
    texto === "okay" ||
    texto === "confirmo" ||
    texto.includes("pode sim") ||
    texto.includes("sim pode")
);


}

function cancelou(texto) {
texto = normalizarTexto(texto);


return (
    texto === "nao" ||
    texto === "cancelar" ||
    texto === "cancela" ||
    texto === "cancele"
);


}

function querApagar(texto) {
texto = normalizarTexto(texto);


return (
    texto.includes("apagar lembrete") ||
    texto.includes("apague lembrete") ||
    texto.includes("apagar o lembrete") ||
    texto.includes("apague o lembrete") ||
    texto.includes("excluir lembrete") ||
    texto.includes("exclua lembrete") ||
    texto.includes("remover lembrete") ||
    texto.includes("remova lembrete") ||
    texto.includes("cancelar lembrete") ||
    texto.includes("cancele lembrete")
);


}

function querCriarLembrete(texto) {
texto = normalizarTexto(texto);


return (
    texto.includes("criar lembrete") ||
    texto.includes("criando lembrete") ||
    texto.includes("crie lembrete") ||
    texto.includes("crie um lembrete") ||
    texto.includes("novo lembrete") ||
    texto.includes("adicionar lembrete") ||
    texto.includes("adicione lembrete")
);


}

function excluirLembrete(nome, callback) {
nome = limparNomeApagar(nome);


if (!nome) {
    callback(false);
    return;
}

console.log("Buscando lembrete para apagar:", nome);

const sql = `
    DELETE FROM lembretes1
    WHERE LOWER(nome) LIKE ?
`;

db.query(
    sql,
    [`%${nome}%`],
    (erro, resultado) => {
        if (erro) {
            console.log("Erro ao apagar lembrete:", erro);
            callback(false);
            return;
        }

        callback(resultado.affectedRows > 0);
    }
);


}

function verificarBanco() {
const sql = `         SELECT id, nome, data, hora, lembrar_em
        FROM lembretes1
        WHERE lembrar_em IS NOT NULL
        AND lembrar_em <= NOW()
        ORDER BY lembrar_em ASC
    `;


db.query(sql, (erro, resultados) => {
    if (erro) {
        console.log("Erro ao verificar lembretes:", erro);
        return;
    }

    resultados.forEach((lembrete) => {
        if (!lembretesAvisados.has(lembrete.id)) {
            lembretesAvisados.add(lembrete.id);

            console.log("==================================");
            console.log("LEMBRETE VENCIDO:", lembrete.nome);
            console.log("DATA:", lembrete.data);
            console.log("HORA:", lembrete.hora);
            console.log("==================================");
        }
    });
});


}

setInterval(verificarBanco, 1000);

app.get("/lembretes/vencidos", (req, res) => {
const sql = `         SELECT id, nome, data, hora, lembrar_em
        FROM lembretes1
        WHERE lembrar_em IS NOT NULL
        AND lembrar_em <= NOW()
        ORDER BY lembrar_em ASC
    `;


db.query(sql, (erro, resultados) => {
    if (erro) {
        console.log("Erro ao buscar lembretes vencidos:", erro);

        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao buscar lembretes."
        });
    }

    res.json({
        sucesso: true,
        lembretes: resultados
    });
});


});

app.get("/lembretes/avisar", (req, res) => {
const sql = `         SELECT id, nome, data, hora, lembrar_em
        FROM lembretes1
        WHERE lembrar_em IS NOT NULL
        AND lembrar_em <= NOW()
        ORDER BY lembrar_em ASC
    `;


db.query(sql, (erro, resultados) => {
    if (erro) {
        console.log("Erro ao buscar lembretes para aviso:", erro);

        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao buscar lembretes."
        });
    }

    const novosLembretes = resultados.filter(
        (lembrete) => !lembretesAvisados.has(lembrete.id)
    );

    novosLembretes.forEach((lembrete) => {
        lembretesAvisados.add(lembrete.id);
    });

    res.json({
        sucesso: true,
        lembretes: novosLembretes
    });
});


});

app.delete("/lembretes/:id", (req, res) => {
const id = req.params.id;


const sql = `
    DELETE FROM lembretes1
    WHERE id = ?
`;

db.query(
    sql,
    [id],
    (erro, resultado) => {
        if (erro) {
            console.log("Erro ao excluir lembrete:", erro);

            return res.status(500).json({
                sucesso: false
            });
        }

        lembretesAvisados.delete(Number(id));

        res.json({
            sucesso: resultado.affectedRows > 0
        });
    }
);


});

app.post("/comando", (req, res) => {
let comando = req.body.comando;


if (!comando) {
    return res.json(
        responder("Não recebi nenhum comando.")
    );
}

comando = normalizarTexto(comando);

console.log("==================================");
console.log("Pessoa:", comando);
console.log("Estado atual:", estado);
console.log("==================================");

if (
    comando === "cancelar" ||
    comando === "cancela" ||
    comando === "cancele"
) {
    resetar();

    return res.json(
        responder("Tudo bem. Operação cancelada.")
    );
}

if (estado === ESTADOS.CONFIRMAR_UBER) {
    if (confirmou(comando)) {
        abrirUber();
        resetar();

        return res.json(
            responder("Abrindo Uber.")
        );
    }

    if (cancelou(comando)) {
        resetar();

        return res.json(
            responder("Tudo bem. Uber cancelado.")
        );
    }

    return res.json(
        responder("Responda apenas sim ou não.")
    );
}

if (estado === ESTADOS.CONFIRMAR_GPS) {
    if (confirmou(comando)) {
        abrirGPS();
        resetar();

        return res.json(
            responder("Abrindo GPS.")
        );
    }

    if (cancelou(comando)) {
        resetar();

        return res.json(
            responder("Tudo bem. GPS cancelado.")
        );
    }

    return res.json(
        responder("Responda apenas sim ou não.")
    );
}

if (estado === ESTADOS.APAGAR_LEMBRETE) {
    excluirLembrete(
        comando,
        (sucesso) => {
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
        }
    );

    return;
}

if (estado === ESTADOS.CRIAR_NOME) {
    const nome = limparNomeCriacao(comando);

    if (!nome) {
        return res.json(
            responder(
                "Qual é o nome ou compromisso do lembrete?"
            )
        );
    }

    lembreteAtual.nome = nome;
    estado = ESTADOS.CRIAR_DATA;

    return res.json(
        responder("Qual é a data?")
    );
}

if (estado === ESTADOS.CRIAR_DATA) {
    const data = converterData(comando);

    if (!data) {
        return res.json(
            responder(
                "Não consegui entender a data. Diga, por exemplo, 02/10/2026."
            )
        );
    }

    lembreteAtual.data = data;
    estado = ESTADOS.CRIAR_HORA;

    return res.json(
        responder("Qual é o horário?")
    );
}

if (estado === ESTADOS.CRIAR_HORA) {
    const hora = converterHora(comando);

    if (!hora) {
        return res.json(
            responder(
                "Não consegui entender o horário. Diga, por exemplo, 14:30."
            )
        );
    }

    lembreteAtual.hora = hora;

    salvarLembrete(
        (sucesso) => {
            if (!sucesso) {
                resetar();

                return res.json(
                    responder(
                        "Não consegui salvar o lembrete."
                    )
                );
            }

            const nome = lembreteAtual.nome;
            const data = lembreteAtual.data;
            const horaSalva = lembreteAtual.hora;

            const dataFormatada = data
                .split("-")
                .reverse()
                .join("/");

            resetar();

            return res.json(
                responder(
                    `Pronto. Lembrete "${nome}" criado para ${dataFormatada} às ${horaSalva}.`
                )
            );
        }
    );

    return;
}

if (estado === ESTADOS.MENU) {
    if (comando.includes("uber")) {
        estado = ESTADOS.CONFIRMAR_UBER;

        return res.json(
            responder(
                "Você quer que eu abra o Uber?"
            )
        );
    }

    if (
        comando.includes("gps") ||
        comando.includes("mapa") ||
        comando.includes("localizacao")
    ) {
        estado = ESTADOS.CONFIRMAR_GPS;

        return res.json(
            responder(
                "Você quer que eu abra o GPS?"
            )
        );
    }

    if (querApagar(comando)) {
        estado = ESTADOS.APAGAR_LEMBRETE;

        return res.json(
            responder(
                "Qual lembrete você deseja apagar?"
            )
        );
    }

    if (querCriarLembrete(comando)) {
        const nomeInicial = limparNomeCriacao(comando);

        if (nomeInicial) {
            lembreteAtual.nome = nomeInicial;
            estado = ESTADOS.CRIAR_DATA;

            return res.json(
                responder(
                    `Entendi. O lembrete é sobre ${nomeInicial}. Qual é a data?`
                )
            );
        }

        estado = ESTADOS.CRIAR_NOME;

        return res.json(
            responder(
                "Claro. Qual é o compromisso?"
            )
        );
    }
}

return res.json(
    responder(
        "Desculpe, não entendi esse comando."
    )
);


});

app.listen(
PORTA,
() => {
console.log("==================================");
console.log(" GLIDIA INICIADA ");
console.log("==================================");
console.log("Porta:", PORTA);
console.log("API: [http://localhost](http://localhost):" + PORTA);
console.log("Banco conectado.");
console.log("Sistema de lembretes ativo.");
console.log("==================================");
}
);
