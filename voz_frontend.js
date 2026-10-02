let ouvindo = false;
let glidiaFalando = false;

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

    if (depois) {
        depois();
    }
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

    atualizarStatus("🎤 Estou ouvindo...");
};

voz.onend = function () {

    ouvindo = false;
};

voz.onerror = function (erro) {

    console.log("Erro voz:", erro);

    ouvindo = false;

    if (erro.error === "no-speech") {

        atualizarStatus(
            "Pressione o botão para falar novamente."
        );

        return;
    }

    if (erro.error === "not-allowed") {

        atualizarStatus(
            "Permissão do microfone bloqueada."
        );

        return;
    }

    atualizarStatus(
        "Não foi possível ouvir. Pressione o botão para tentar novamente."
    );
};

voz.onresult = function (event) {

    let comando = event.results[0][0]
        .transcript
        .toLowerCase()
        .trim();

    console.log("Reconhecido:", comando);

    if (glidiaFalando) {
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
            "Pressione o botão para falar novamente."
        );

        return;
    }

    atualizarStatus(
        "🤖 Entendi: " + comando
    );

    processarComando(comando);
};


}

function botaoBengala() {


iniciarGlidia();


}

function iniciarGlidia() {


if (glidiaFalando || ouvindo) {
    return;
}

atualizarStatus(
    "🟢 Glídia ativada"
);

glidiaFalar(
    "Olá! Como posso te ajudar?",
    function () {
        iniciarEscuta();
    }
);


}

function iniciarEscuta() {


if (!voz) {

    atualizarStatus(
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

function processarComando(comando) {


if (
    comando.includes("gps") ||
    comando.includes("mapa") ||
    comando.includes("google maps") ||
    comando.includes("localização") ||
    comando.includes("localizacao") ||
    comando.includes("navegação") ||
    comando.includes("navegacao")
) {

    abrirGPS();
    return;
}

if (
    comando.includes("uber") ||
    comando.includes("chamar um carro") ||
    comando.includes("chamar carro") ||
    comando.includes("quero um carro")
) {

    abrirUber();
    return;
}

enviarComando(comando);


}

function abrirGPS() {


const url =
    "https://www.google.com/maps/search/?api=1&query=Google+Maps";

atualizarStatus(
    "📍 Abrindo GPS..."
);

glidiaFalar(
    "Abrindo o GPS.",
    function () {

        window.open(
            url,
            "_blank"
        );
    }
);


}

function abrirUber() {


const url =
    "https://m.uber.com/";

atualizarStatus(
    "🚖 Abrindo Uber..."
);

glidiaFalar(
    "Abrindo o Uber.",
    function () {

        window.open(
            url,
            "_blank"
        );
    }
);


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
            "Erro HTTP: " + resposta.status
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
            dados.resposta
        );

        return;
    }

    atualizarStatus(
        "Resposta inválida."
    );

} catch (erro) {

    console.log(
        "Erro ao conectar com Glídia:",
        erro
    );

    atualizarStatus(
        "Erro de conexão com o sistema."
    );

    glidiaFalar(
        "Não consegui conectar ao sistema."
    );
}


}
