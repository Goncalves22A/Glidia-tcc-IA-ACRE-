let ouvindo = false;
let glidiaFalando = false;
let intervaloLembretes = null;

function atualizarStatus(texto) {
const status = document.getElementById("status");


if (status) {
    status.innerHTML = texto;
}


}

function glidiaFalar(texto, depois) {
glidiaFalando = true;


if (voz && ouvindo) {
    try {
        voz.stop();
    } catch (e) {
        console.log("Erro ao parar reconhecimento:", e);
    }
}

ouvindo = false;

speechSynthesis.cancel();

const fala = new SpeechSynthesisUtterance(texto);

fala.lang = "pt-BR";
fala.rate = 1;
fala.pitch = 1;

fala.onend = function () {
    glidiaFalando = false;

    setTimeout(() => {
        if (depois) {
            depois();
        }
    }, 500);
};

speechSynthesis.speak(fala);


}

const ReconhecimentoVoz =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

let voz = null;

if (ReconhecimentoVoz) {
voz = new ReconhecimentoVoz();


voz.lang = "pt-BR";
voz.continuous = false;
voz.interimResults = false;
voz.maxAlternatives = 1;

voz.onstart = function () {
    ouvindo = true;

    atualizarStatus(
        "🎤 Estou ouvindo..."
    );
};

voz.onend = function () {
    ouvindo = false;
};

voz.onerror = function (erro) {
    console.log(
        "Erro voz:",
        erro
    );

    ouvindo = false;

    atualizarStatus(
        "❌ Não consegui ouvir"
    );
};

voz.onresult = function (event) {
    let comando = event.results[0][0]
        .transcript
        .toLowerCase()
        .trim();

    console.log(
        "Reconhecido:",
        comando
    );

    if (glidiaFalando) {
        console.log(
            "Ignorando reconhecimento enquanto Glidia fala:",
            comando
        );

        return;
    }

    const palavrasSemSentido = [
        "",
        "hã",
        "hum",
        "aham",
        "é",
        "eh",
        "lalala",
        "la la la",
        "música",
        "musica",
        "milímetro",
        "milimetro"
    ];

    if (
        palavrasSemSentido.includes(comando) ||
        comando.length < 2
    ) {
        atualizarStatus(
            "🎤 Não entendi. Pode repetir?"
        );

        setTimeout(() => {
            iniciarEscuta();
        }, 500);

        return;
    }

    atualizarStatus(
        "🤖 Entendi: " + comando
    );

    enviarComando(comando);
};


}

function botaoBengala() {
iniciarGlidia();
}

function iniciarGlidia() {
atualizarStatus(
"🟢 Glidia ativada"
);


glidiaFalar(
    "Olá! Como posso te ajudar?",
    function () {
        iniciarEscuta();
    }
);

iniciarVerificacaoLembretes();


}

function iniciarEscuta() {
if (!voz) {
glidiaFalar(
"Seu navegador não suporta reconhecimento de voz."
);


    return;
}

if (glidiaFalando) {
    return;
}

if (ouvindo) {
    return;
}

try {
    voz.start();
} catch (e) {
    console.log(
        "Erro ao iniciar reconhecimento:",
        e
    );
}


}

async function enviarComando(comando) {
try {
const resposta = await fetch(
"http://localhost:3000/comando",
{
method: "POST",


            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                comando: comando
            })
        }
    );

    if (!resposta.ok) {
        throw new Error(
            "Erro HTTP: " +
            resposta.status
        );
    }

    const dados = await resposta.json();

    console.log(
        "Servidor respondeu:",
        dados
    );

    if (dados.resposta) {
        atualizarStatus(
            "🤖 " + dados.resposta
        );

        glidiaFalar(
            dados.resposta,
            function () {
                iniciarEscuta();
            }
        );

        return;
    }

    atualizarStatus(
        "❌ Resposta inválida"
    );

    glidiaFalar(
        "O sistema não retornou uma resposta.",
        function () {
            iniciarEscuta();
        }
    );
} catch (erro) {
    console.log(
        "Erro ao conectar com Glidia:",
        erro
    );

    atualizarStatus(
        "❌ Erro de conexão"
    );

    glidiaFalar(
        "Não consegui conectar ao sistema.",
        function () {
            iniciarEscuta();
        }
    );
}


}

function iniciarVerificacaoLembretes() {
if (intervaloLembretes) {
return;
}


verificarLembretes();

intervaloLembretes = setInterval(
    verificarLembretes,
    5000
);


}

async function verificarLembretes() {
if (glidiaFalando) {
return;
}


try {
    const resposta = await fetch(
        "http://localhost:3000/lembretes/avisar"
    );

    if (!resposta.ok) {
        throw new Error(
            "Erro HTTP: " +
            resposta.status
        );
    }

    const dados = await resposta.json();

    console.log(
        "Verificação de lembretes:",
        dados
    );

    if (
        !dados.sucesso ||
        !dados.lembretes ||
        dados.lembretes.length === 0
    ) {
        return;
    }

    const lembrete = dados.lembretes[0];

    let dataFormatada = lembrete.data;

    if (typeof dataFormatada === "string") {
        if (dataFormatada.includes("T")) {
            dataFormatada =
                dataFormatada
                    .split("T")[0]
                    .split("-")
                    .reverse()
                    .join("/");
        } else if (dataFormatada.includes("-")) {
            dataFormatada =
                dataFormatada
                    .split("-")
                    .reverse()
                    .join("/");
        }
    }

    let horaFormatada = lembrete.hora || "";

    if (horaFormatada.length >= 5) {
        horaFormatada =
            horaFormatada.substring(0, 5);
    }

    atualizarStatus(
        "⏰ Lembrete: " +
        lembrete.nome
    );

    glidiaFalar(
        `Atenção. Você tem um lembrete. ${lembrete.nome}. Agendado para ${dataFormatada} às ${horaFormatada}.`,
        function () {
            iniciarEscuta();
        }
    );
} catch (erro) {
    console.log(
        "Erro ao verificar lembretes:",
        erro
    );
}


}
