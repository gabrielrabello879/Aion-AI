import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// =========================================================
// CONFIGURAÇÃO DO SUPABASE
// =========================================================

// MANTENHA AQUI OS MESMOS VALORES
// QUE JÁ ESTÃO FUNCIONANDO NO SEU LOGIN.JS

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
// ELEMENTOS
// =========================================================

const loginForm =
    document.getElementById("login-form");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const togglePassword =
    document.getElementById("toggle-password");

const loginButton =
    document.getElementById("login-button");

const loginButtonText =
    document.getElementById("login-button-text");

const loginMessage =
    document.getElementById("login-message");

const forgotPassword =
    document.getElementById("forgot-password");

const createAccount =
    document.getElementById("create-account");

const googleLogin =
    document.getElementById("google-login");



// =========================================================
// MOSTRAR / ESCONDER SENHA
// =========================================================

if (
    togglePassword &&
    passwordInput
) {

    togglePassword.addEventListener(
        "click",
        () => {

            const isPassword =
                passwordInput.type === "password";

            passwordInput.type =
                isPassword
                    ? "text"
                    : "password";

            togglePassword.textContent =
                isPassword
                    ? "◎"
                    : "◉";


            togglePassword.setAttribute(
                "aria-label",
                isPassword
                    ? "Ocultar senha"
                    : "Mostrar senha"
            );

        }
    );

}



// =========================================================
// EXIBIR MENSAGEM
// =========================================================

function showMessage(
    message,
    type = "error"
) {

    if (!loginMessage) {
        return;
    }


    loginMessage.style.display =
        "block";


    loginMessage.textContent =
        message;


    if (type === "success") {

        loginMessage.style.background =
            "rgba(34, 197, 94, 0.10)";

        loginMessage.style.border =
            "1px solid rgba(34, 197, 94, 0.22)";

        loginMessage.style.color =
            "#86efac";

    } else {

        loginMessage.style.background =
            "rgba(239, 68, 68, 0.10)";

        loginMessage.style.border =
            "1px solid rgba(239, 68, 68, 0.22)";

        loginMessage.style.color =
            "#fca5a5";

    }

}



// =========================================================
// ESCONDER MENSAGEM
// =========================================================

function hideMessage() {

    if (!loginMessage) {
        return;
    }


    loginMessage.style.display =
        "none";

    loginMessage.textContent =
        "";

}



// =========================================================
// ESTADO DO BOTÃO DE LOGIN
// =========================================================

function setLoading(isLoading) {

    if (!loginButton) {
        return;
    }


    loginButton.disabled =
        isLoading;


    if (loginButtonText) {

        loginButtonText.textContent =
            isLoading
                ? "Entrando..."
                : "Entrar";

    }

}



// =========================================================
// LOGIN COM E-MAIL E SENHA
// =========================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            hideMessage();


            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();

            const password =
                passwordInput.value;


            if (
                !email ||
                !password
            ) {

                showMessage(
                    "Preencha seu e-mail e sua senha."
                );

                return;

            }


            setLoading(true);


            try {

                const {
                    data,
                    error
                } =
                    await supabase.auth.signInWithPassword({

                        email: email,

                        password: password

                    });


                if (error) {

                    console.error(
                        "Erro de login:",
                        error
                    );


                    if (
                        error.message ===
                        "Invalid login credentials"
                    ) {

                        showMessage(
                            "E-mail ou senha incorretos."
                        );

                    } else if (
                        error.message
                            .toLowerCase()
                            .includes("email not confirmed")
                    ) {

                        showMessage(
                            "Confirme seu e-mail antes de entrar."
                        );

                    } else {

                        showMessage(
                            "Não foi possível entrar. Tente novamente."
                        );

                    }


                    return;

                }


                if (!data.user) {

                    showMessage(
                        "Não foi possível identificar o usuário."
                    );

                    return;

                }


                showMessage(
                    "Login realizado com sucesso.",
                    "success"
                );


                setTimeout(
                    () => {

                        window.location.href =
                            "dashboard.html";

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "Erro inesperado:",
                    error
                );


                showMessage(
                    "Ocorreu um erro inesperado. Tente novamente."
                );

            } finally {

                setLoading(false);

            }

        }
    );

}



// =========================================================
// LOGIN COM GOOGLE
// =========================================================

if (googleLogin) {

    googleLogin.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();

            hideMessage();

            try {

                googleLogin.disabled = true;

                const {
                    data,
                    error
                } =
                    await supabase.auth.signInWithOAuth({

                        provider: "google",

                        options: {

                            redirectTo:
                                "http://127.0.0.1:5500/html/completar-cadastro.html",

                            queryParams: {
                                prompt: "select_account"
                            }

                        }

                    });


                if (error) {

                    console.error(
                        "Erro no login com Google:",
                        error
                    );

                    showMessage(
                        "Não foi possível entrar com o Google."
                    );

                    googleLogin.disabled = false;

                }

            } catch (error) {

                console.error(
                    "Erro inesperado no login com Google:",
                    error
                );

                showMessage(
                    "Ocorreu um erro ao conectar com o Google."
                );

                googleLogin.disabled = false;

            }

        }
    );

}



// =========================================================
// RECUPERAÇÃO DE SENHA
// =========================================================

if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        (event) => {

            event.preventDefault();


            showMessage(
                "A recuperação de senha será configurada em seguida."
            );

        }
    );

}



// =========================================================
// CRIAR CONTA
// =========================================================

if (createAccount) {

    createAccount.addEventListener(
        "click",
        (event) => {

            const href =
                createAccount.getAttribute("href");


            if (
                !href ||
                href === "#"
            ) {

                event.preventDefault();

                window.location.href =
                    "cadastro.html";

            }

        }
    );

}



// =========================================================
// VERIFICAR SE JÁ EXISTE SESSÃO
// =========================================================

async function checkExistingSession() {

    try {

        const {
            data,
            error
        } =
            await supabase.auth.getSession();


        if (error) {

            console.error(
                "Erro ao verificar sessão:",
                error
            );

            return;

        }


        if (data.session) {

            window.location.href =
                "dashboard.html";

        }


    } catch (error) {

        console.error(
            "Erro ao verificar sessão:",
            error
        );

    }

}


checkExistingSession();