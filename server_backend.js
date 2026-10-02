const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();

app.use(cors());
app.use(express.json());

const PORTA = 3000;

function responder(texto) {
    return {
        resposta: texto
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

function abrirUber() {
    console.log("Abrindo Uber...");

    exec(
        'start "" "https://m.uber.com/"',
        (erro) => {
            if (erro) {
                console.log("Erro ao abrir Uber:", erro);
            }
        }
    );
}

function abrirGPS() {
    console.log("Abrindo Google Maps...");

    exec(
        'start "" "https://www.google.com/maps"',
        (erro) => {
            if (erro) {
                console.log("Erro ao abrir Google Maps:", erro);
            }
        }
    );
}

app.post("/comando", (req, res) => {

    let comando = req.body.comando;

    if (!comando) {
        return res.json(
            responder("Não recebi nenhum comando.")
        );
    }

    comando = normalizarTexto(comando);

    console.log("Pessoa:", comando);

    const palavrasGPS = [
        "gps",
        "mapa",
        "maps",
        "localizacao",
        "localização",
        "abrir gps",
        "abrindo gps",
        "abra o gps",
        "abre o gps",
        "quero gps",
        "quero abrir gps",
        "abrir mapa",
        "abrindo mapa",
        "abra o mapa",
        "abre o mapa",
        "quero mapa"
    ];

    const palavrasUber = [
        "uber",
        "abrir uber",
        "abrindo uber",
        "abra o uber",
        "abre o uber",
        "quero uber",
        "quero abrir uber"
    ];

    const pediuGPS = palavrasGPS.some(
        palavra => comando.includes(palavra)
    );

    const pediuUber = palavrasUber.some(
        palavra => comando.includes(palavra)
    );

    if (pediuGPS) {

        abrirGPS();

        return res.json(
            responder("Abrindo o GPS.")
        );
    }

    if (pediuUber) {

        abrirUber();

        return res.json(
            responder("Abrindo o Uber.")
        );
    }

    return res.json(
        responder(
            "Posso abrir o GPS ou o Uber. Pressione o botão e diga o que você precisa."
        )
    );
});

app.listen(PORTA, () => {

    console.log("GLIDIA INICIADA");
    console.log("Porta:", PORTA);
    console.log("API: http://localhost:" + PORTA);
    console.log("GPS e Uber ativos.");

});