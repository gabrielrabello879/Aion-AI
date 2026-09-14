import {
    supabase
} from "./supabase-client.js";


// =========================================================
// ELEMENTOS
// =========================================================

const form =
    document.getElementById(
        "complete-registration-form"
    );

const companyNameInput =
    document.getElementById(
        "company-name"
    );

const message =
    document.getElementById(
        "registration-message"
    );

const submitButton =
    document.getElementById(
        "complete-registration-button"
    );

const submitButtonText =
    document.getElementById(
        "complete-registration-button-text"
    );



let currentUser = null;
let currentCompanyId = null;



// =========================================================
// MENSAGENS
// =========================================================

function showMessage(
    text,
    type = "error"
) {

    if (!message) {
        return;
    }

    message.style.display =
        "block";

    message.textContent =
        text;

    message.style.padding =
        "12px 14px";

    message.style.borderRadius =
        "10px";

    message.style.fontSize =
        "12px";

    message.style.lineHeight =
        "1.5";


    if (type === "success") {

        message.style.background =
            "rgba(34, 197, 94, 0.10)";

        message.style.border =
            "1px solid rgba(34, 197, 94, 0.22)";

        message.style.color =
            "#86efac";

    } else {

        message.style.background =
            "rgba(239, 68, 68, 0.10)";

        message.style.border =
            "1px solid rgba(239, 68, 68, 0.22)";

        message.style.color =
            "#fca5a5";

    }

}



function hideMessage() {

    if (!message) {
        return;
    }

    message.style.display =
        "none";

    message.textContent =
        "";

}



// =========================================================
// LOADING
// =========================================================

function setLoading(
    isLoading
) {

    if (submitButton) {

        submitButton.disabled =
            isLoading;

    }

    if (companyNameInput) {

        companyNameInput.disabled =
            isLoading;

    }

    if (submitButtonText) {

        submitButtonText.textContent =
            isLoading
                ? "Salvando..."
                : "Continuar para o painel";

    }

}



// =========================================================
// REDIRECIONAR LOGIN
// =========================================================

function goToLogin() {

    window.location.replace(
        "login.html"
    );

}



// =========================================================
// REDIRECIONAR DASHBOARD
// =========================================================

function goToDashboard() {

    window.location.replace(
        "dashboard.html"
    );

}



// =========================================================
// VERIFICAR USUÁRIO
// =========================================================

async function initializePage() {

    hideMessage();

    try {

        // =================================================
        // VERIFICAR SESSÃO
        // =================================================

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabase.auth.getSession();


        if (sessionError) {

            console.error(
                "Erro ao verificar sessão:",
                sessionError
            );

            goToLogin();

            return;

        }


        if (
            !sessionData.session ||
            !sessionData.session.user
        ) {

            goToLogin();

            return;

        }



        // =================================================
        // VALIDAR USUÁRIO
        // =================================================

        const {
            data: userData,
            error: userError
        } =
            await supabase.auth.getUser();


        if (
            userError ||
            !userData.user
        ) {

            console.error(
                "Erro ao validar usuário:",
                userError
            );

            goToLogin();

            return;

        }


        currentUser =
            userData.user;



        // =================================================
        // BUSCAR PROFILE
        // =================================================

        const {
            data: profile,
            error: profileError
        } =
            await supabase
                .from("profiles")
                .select(
                    "company_id, full_name"
                )
                .eq(
                    "id",
                    currentUser.id
                )
                .single();


        if (profileError) {

            console.error(
                "Erro ao carregar perfil:",
                profileError
            );

            showMessage(
                "Não foi possível carregar seu perfil."
            );

            return;

        }


        if (
            !profile ||
            !profile.company_id
        ) {

            showMessage(
                "Nenhuma empresa foi vinculada a esta conta."
            );

            return;

        }


        currentCompanyId =
            profile.company_id;



        // =================================================
        // BUSCAR EMPRESA
        // =================================================

        const {
            data: company,
            error: companyError
        } =
            await supabase
                .from("companies")
                .select(
                    "id, name, onboarding_completed"
                )
                .eq(
                    "id",
                    currentCompanyId
                )
                .single();


        if (companyError) {

            console.error(
                "Erro ao carregar empresa:",
                companyError
            );

            showMessage(
                "Não foi possível carregar os dados da empresa."
            );

            return;

        }



        // =================================================
        // ONBOARDING JÁ CONCLUÍDO
        // =================================================

        if (
            company.onboarding_completed
        ) {

            goToDashboard();

            return;

        }



        // =================================================
        // PREENCHER CAMPO
        // =================================================

        if (
            company.name &&
            company.name.trim() !== "" &&
            company.name !== "Minha empresa"
        ) {

            companyNameInput.value =
                company.name;

            return;

        }



        // =================================================
        // SUGESTÃO DE NOME
        // =================================================

        const googleName =
            currentUser
                .user_metadata
                ?.name;

        if (
            googleName &&
            companyNameInput &&
            !companyNameInput.value
        ) {

            companyNameInput.placeholder =
                "Ex.: " + googleName;

        }


        companyNameInput?.focus();


    } catch (error) {

        console.error(
            "Erro inesperado:",
            error
        );

        showMessage(
            "Ocorreu um erro ao preparar seu cadastro."
        );

    }

}



// =========================================================
// SALVAR EMPRESA
// =========================================================

if (form) {

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            hideMessage();


            if (
                submitButton?.disabled
            ) {

                return;

            }


            const companyName =
                companyNameInput.value
                    .trim();


            if (
                companyName.length < 2
            ) {

                showMessage(
                    "Informe o nome da sua empresa."
                );

                companyNameInput.focus();

                return;

            }


            if (!currentCompanyId) {

                showMessage(
                    "Não foi possível identificar sua empresa."
                );

                return;

            }


            setLoading(true);


            try {

                const {
                    data,
                    error
                } =
                    await supabase
                        .from("companies")
                        .update({

                            name:
                                companyName,

                            onboarding_completed:
                                true,

                            updated_at:
                                new Date()
                                    .toISOString()

                        })
                        .eq(
                            "id",
                            currentCompanyId
                        )
                        .select(
                            "id, name, onboarding_completed"
                        )
                        .single();


                if (error) {

                    console.error(
                        "Erro ao atualizar empresa:",
                        error
                    );

                    showMessage(
                        "Não foi possível salvar o nome da empresa."
                    );

                    return;

                }


                if (
                    !data ||
                    !data.onboarding_completed
                ) {

                    showMessage(
                        "Não foi possível concluir seu cadastro."
                    );

                    return;

                }


                showMessage(
                    "Empresa configurada com sucesso.",
                    "success"
                );


                setTimeout(
                    () => {

                        goToDashboard();

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "Erro inesperado:",
                    error
                );

                showMessage(
                    "Ocorreu um erro ao salvar os dados."
                );

            } finally {

                setLoading(false);

            }

        }
    );

}



// =========================================================
// MONITORAR LOGOUT
// =========================================================

supabase.auth.onAuthStateChange(
    (event) => {

        if (
            event === "SIGNED_OUT"
        ) {

            goToLogin();

        }

    }
);



// =========================================================
// INICIAR
// =========================================================

initializePage();