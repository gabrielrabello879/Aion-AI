import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// =========================================================
// CONFIGURAÇÃO SUPABASE
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
// ELEMENTOS
// =========================================================

const registerForm =
    document.getElementById("register-form");

const fullNameInput =
    document.getElementById("full-name");

const companyNameInput =
    document.getElementById("company-name");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirm-password");

const togglePassword =
    document.getElementById("toggle-password");

const toggleConfirmPassword =
    document.getElementById("toggle-confirm-password");

const registerButton =
    document.getElementById("register-button");

const registerButtonText =
    document.getElementById("register-button-text");

const registerMessage =
    document.getElementById("register-message");



// =========================================================
// MENSAGENS
// =========================================================

function showMessage(
    message,
    type = "error"
) {

    registerMessage.style.display =
        "block";

    registerMessage.textContent =
        message;


    if (type === "success") {

        registerMessage.style.background =
            "rgba(34, 197, 94, 0.10)";

        registerMessage.style.border =
            "1px solid rgba(34, 197, 94, 0.22)";

        registerMessage.style.color =
            "#86efac";

    } else {

        registerMessage.style.background =
            "rgba(239, 68, 68, 0.10)";

        registerMessage.style.border =
            "1px solid rgba(239, 68, 68, 0.22)";

        registerMessage.style.color =
            "#fca5a5";

    }

}



function hideMessage() {

    registerMessage.style.display =
        "none";

    registerMessage.textContent =
        "";

}



// =========================================================
// LOADING
// =========================================================

function setLoading(isLoading) {

    registerButton.disabled =
        isLoading;

    registerButtonText.textContent =
        isLoading
            ? "Criando conta..."
            : "Criar conta";

}



// =========================================================
// MOSTRAR / ESCONDER SENHAS
// =========================================================

function setupPasswordToggle(
    button,
    input
) {

    if (
        !button ||
        !input
    ) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            const hidden =
                input.type === "password";

            input.type =
                hidden
                    ? "text"
                    : "password";

            button.textContent =
                hidden
                    ? "◎"
                    : "◉";

        }
    );

}


setupPasswordToggle(
    togglePassword,
    passwordInput
);

setupPasswordToggle(
    toggleConfirmPassword,
    confirmPasswordInput
);



// =========================================================
// CADASTRO
// =========================================================

registerForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        hideMessage();


        const fullName =
            fullNameInput.value.trim();

        const companyName =
            companyNameInput.value.trim();

        const email =
            emailInput.value
                .trim()
                .toLowerCase();

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;



        // =================================================
        // VALIDAÇÕES
        // =================================================

        if (
            !fullName ||
            !companyName ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            showMessage(
                "Preencha todos os campos."
            );

            return;

        }


        if (
            password.length < 6
        ) {

            showMessage(
                "A senha deve possuir pelo menos 6 caracteres."
            );

            return;

        }


        if (
            password !==
            confirmPassword
        ) {

            showMessage(
                "As senhas não são iguais."
            );

            return;

        }



        setLoading(true);



        try {


            const {
                data,
                error
            } =
                await supabase.auth.signUp({

                    email: email,

                    password: password,

                    options: {

                        emailRedirectTo:
                            "http://127.0.0.1:5500/html/login.html",

                        data: {

                            full_name:
                                fullName,

                            company_name:
                                companyName

                        }

                    }

                });



            if (error) {

                console.error(
                    "Erro no cadastro:",
                    error
                );


                if (
                    error.message
                        .toLowerCase()
                        .includes("already registered")
                ) {

                    showMessage(
                        "Este e-mail já possui uma conta."
                    );

                } else {

                    showMessage(
                        error.message
                    );

                }


                return;

            }



            if (!data.user) {

                showMessage(
                    "Não foi possível criar sua conta."
                );

                return;

            }



            // =================================================
            // EMAIL CONFIRMATION ATIVO
            // =================================================

            if (!data.session) {

                showMessage(
                    "Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.",
                    "success"
                );


                registerForm.reset();

                return;

            }



            // =================================================
            // SE JÁ EXISTIR SESSÃO
            // =================================================

            showMessage(
                "Conta criada com sucesso.",
                "success"
            );


            setTimeout(
                () => {

                    window.location.href =
                        "dashboard.html";

                },
                700
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