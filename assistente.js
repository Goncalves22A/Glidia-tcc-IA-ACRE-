let ouvindo = false;


// ==========================================
// STATUS
// ==========================================

function atualizarStatus(texto){

    const status = document.getElementById("status");

    if(status){
        status.innerHTML = texto;
    }

}



// ==========================================
// VOZ DA GLIDIA
// ==========================================

function glidiaFalar(texto, depois){

    // Garante que o reconhecimento pare antes da fala
    if(voz && ouvindo){

        try{

            voz.stop();

        }catch(e){

            console.log("Erro ao parar reconhecimento:", e);

        }

    }

    speechSynthesis.cancel();

    const fala = new SpeechSynthesisUtterance(texto);

    fala.lang = "pt-BR";
    fala.rate = 1;
    fala.pitch = 1;

    fala.onend = function(){

        // Pequena pausa para evitar que a Glidia
        // reconheça a própria voz
        setTimeout(()=>{

            if(depois){
                depois();
            }

        },500);

    };

    speechSynthesis.speak(fala);

}




// ==========================================
// RECONHECIMENTO DE VOZ
// ==========================================

const ReconhecimentoVoz =
window.SpeechRecognition ||
window.webkitSpeechRecognition;


let voz = null;



if(ReconhecimentoVoz){

    voz = new ReconhecimentoVoz();

    voz.lang = "pt-BR";
    voz.continuous = false;
    voz.interimResults = false;
    voz.maxAlternatives = 1;



    voz.onstart = function(){

        ouvindo = true;

        atualizarStatus(
            "🎤 Estou ouvindo..."
        );

    };



    voz.onend = function(){

        ouvindo = false;

    };



    voz.onerror = function(erro){

        console.log(
            "Erro voz:",
            erro
        );

        ouvindo = false;

        atualizarStatus(
            "❌ Não consegui ouvir"
        );

    };
    // ==========================================
// RESULTADO DO RECONHECIMENTO DE VOZ
// ==========================================

voz.onresult = function(event){

    let comando = event.results[0][0]
        .transcript
        .toLowerCase()
        .trim();

    console.log(
        "Reconhecido:",
        comando
    );


    // ==========================================
    // IGNORAR A PRÓPRIA VOZ DA GLIDIA
    // ==========================================

    const frasesDaGlidia = [

        "olá",
        "ola",
        "como posso te ajudar",
        "você quer que eu abra",
        "voce quer que eu abra",
        "abrindo uber",
        "abrindo o uber",
        "abrindo gps",
        "abrindo o gps",
        "uber cancelado",
        "gps cancelado",
        "pronto",
        "não consegui conectar",
        "nao consegui conectar"

    ];


    const falouAGlidia = frasesDaGlidia.some(frase =>
        comando.includes(frase)
    );


    if(falouAGlidia){

        console.log(
            "Ignorando fala da Glidia:",
            comando
        );

        iniciarEscuta();

        return;

    }


    // ==========================================
    // FILTRO DE RUÍDOS
    // ==========================================

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


    if(

        palavrasSemSentido.includes(comando) ||

        comando.length < 2

    ){

        atualizarStatus(
            "🎤 Não entendi. Pode repetir?"
        );

        iniciarEscuta();

        return;

    }


    // ==========================================
    // STATUS
    // ==========================================

    atualizarStatus(
        "🤖 Entendi: " + comando
    );


    // ==========================================
    // ENVIA PARA O BACKEND
    // ==========================================

    enviarComando(comando);

};
// ==========================================
// BOTÃO DA BENGALA
// ==========================================

function botaoBengala(){

    iniciarGlidia();

}



// ==========================================
// INICIAR GLIDIA
// ==========================================

function iniciarGlidia(){

    atualizarStatus(
        "🟢 Glidia ativada"
    );

    glidiaFalar(

        "Olá! Como posso te ajudar?",

        function(){

            iniciarEscuta();

        }

    );

}



// ==========================================
// COMEÇAR ESCUTA
// ==========================================

function iniciarEscuta(){

    if(!voz){

        glidiaFalar(
            "Seu navegador não suporta reconhecimento de voz."
        );

        return;

    }

    if(ouvindo){

        return;

    }

    try{

        voz.start();

    }catch(e){

        console.log(
            "Erro ao iniciar reconhecimento:",
            e
        );

    }

}
// ==========================================
// ENVIA PARA BACKEND
// ==========================================

async function enviarComando(comando){

    try{

        const resposta = await fetch(
            "http://localhost:3000/comando",
            {

                method:"POST",

                headers:{

                    "Content-Type":"application/json"

                },

                body:JSON.stringify({

                    comando: comando

                })

            }

        );


        // ===============================
        // VERIFICA SE O SERVIDOR RESPONDEU
        // ===============================

        if(!resposta.ok){

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


        // ===============================
        // RECEBEU UMA RESPOSTA
        // ===============================

        if(dados.resposta){

            atualizarStatus(

                "🤖 " + dados.resposta

            );

            glidiaFalar(

                dados.resposta,

                function(){

                    iniciarEscuta();

                }

            );

            return;

        }


        // ===============================
        // NÃO VEIO RESPOSTA
        // ===============================

        atualizarStatus(

            "❌ Resposta inválida"

        );

        glidiaFalar(

            "O sistema não retornou uma resposta.",

            function(){

                iniciarEscuta();

            }

        );

    }

    catch(erro){

        console.log(

            "Erro ao conectar com Glidia:",

            erro

        );


        atualizarStatus(

            "❌ Erro de conexão"

        );


        glidiaFalar(

            "Não consegui conectar ao sistema.",

            function(){

                iniciarEscuta();

            }

        );

    }

}}