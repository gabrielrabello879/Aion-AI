import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// =========================================================
// SUPABASE
// =========================================================

const SUPABASE_URL =
    "https://ljgdbbgqlfowtaxncnox.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_zH7VBWc-LCytzYgk3eb-7Q_FOAcmfdT";


const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// =========================================================
// PÁGINA DE LOGIN
// =========================================================

const LOGIN_PAGE =
    "login.html";


// =========================================================
// VERIFICAR AUTENTICAÇÃO
// =========================================================

async function protectPage() {

    try {

        const {
            data,
            error
        } =
            await supabase.auth.getSession();


        if (error) {

            console.error(
                "Erro ao verificar autenticação:",
                error
            );

            window.location.replace(
                LOGIN_PAGE
            );

            return;

        }


        const session =
            data.session;


        if (
            !session ||
            !session.user
        ) {

            window.location.replace(
                LOGIN_PAGE
            );

            return;

        }


        console.log(
            "Usuário autenticado:",
            session.user.id
        );


    } catch (error) {

        console.error(
            "Erro inesperado na autenticação:",
            error
        );


        window.location.replace(
            LOGIN_PAGE
        );

    }

}


// =========================================================
// DETECTAR LOGOUT
// =========================================================

supabase.auth.onAuthStateChange(
    (event, session) => {

        if (
            event === "SIGNED_OUT" ||
            !session
        ) {

            window.location.replace(
                LOGIN_PAGE
            );

        }

    }
);


// =========================================================
// INICIAR
// =========================================================

protectPage();


// =========================================================
// EXPORTAR CLIENTE
// =========================================================

export {
    supabase
};