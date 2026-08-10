// ==========================================
// GLÍDIA - SOS
// ==========================================

let dispositivo = null;
let servidor = null;
let caracteristica = null;

// UUIDs (substitua pelos UUIDs corretos caso utilize BLE)
const SERVICE_UUID = "";
const CHARACTERISTIC_UUID = "";


// ==========================================
// CONECTAR BLUETOOTH
// ==========================================

async function conectarBluetooth() {

    try {

        dispositivo = await navigator.bluetooth.requestDevice({

            acceptAllDevices: true,
            optionalServices: [SERVICE_UUID]

        });

        servidor = await dispositivo.gatt.connect();

        document.getElementById("statusBluetooth").textContent =
            "Conectado";

        console.log("Bluetooth conectado!");

    } catch (erro) {

        console.error(erro);

        document.getElementById("statusBluetooth").textContent =
            "Falha ao conectar";

    }

}


// ==========================================
// BOTÃO SOS
// ==========================================

function ativarSOS() {

    document.getElementById("statusSOS").innerHTML =
        "🚨 SOS acionado!";

    obterLocalizacao();

}


// ==========================================
// LOCALIZAÇÃO
// ==========================================

function obterLocalizacao() {

    if (!navigator.geolocation) {

        document.getElementById("localizacao").innerHTML =
            "GPS não suportado.";

        return;

    }

    navigator.geolocation.getCurrentPosition(

        function (posicao) {

            const latitude = posicao.coords.latitude;
            const longitude = posicao.coords.longitude;

            document.getElementById("localizacao").innerHTML =

                `
                Latitude: ${latitude}<br>
                Longitude: ${longitude}
                <br><br>
                <a target="_blank"
                href="https://maps.google.com/?q=${latitude},${longitude}">
                Abrir no Google Maps
                </a>
                `;

            enviarSOS(latitude, longitude);

        },

        function () {

            document.getElementById("localizacao").innerHTML =
                "Não foi possível obter localização.";

        }

    );

}


// ==========================================
// ENVIAR PARA BACKEND
// ==========================================

async function enviarSOS(latitude, longitude) {

    try {

        const resposta = await fetch("http://localhost:3000/sos", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                latitude,
                longitude

            })

        });

        const dados = await resposta.json();

        console.log(dados);

        document.getElementById("statusSOS").innerHTML =
            "✅ Localização enviada ao servidor.";

    }

    catch (erro) {

        console.error(erro);

        document.getElementById("statusSOS").innerHTML =
            "❌ Não foi possível enviar ao servidor.";

    }

}


// ==========================================
// CARREGAR CONTATO
// ==========================================

window.onload = function () {

    const nome = localStorage.getItem("contatoNome");
    const telefone = localStorage.getItem("telefoneEmergencia");

    if (nome)
        document.getElementById("nomeContato").textContent = nome;

    if (telefone)
        document.getElementById("telefoneContato").textContent = telefone;

};