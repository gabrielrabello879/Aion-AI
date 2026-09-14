import {
    supabase
} from "./supabase-client.js";


// =========================================================
// INICIAR PÁGINA
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeSettings();

    }
);



// =========================================================
// ELEMENTOS PRINCIPAIS
// =========================================================

const saveButton =
    document.getElementById(
        "save-general-settings"
    );

const businessNameInput =
    document.getElementById(
        "business-name"
    );



// =========================================================
// DADOS ATUAIS
// =========================================================

let currentUser = null;
let currentCompanyId = null;
let originalCompanyName = "";



// =========================================================
// CARREGAR CONFIGURAÇÕES
// =========================================================

async function initializeSettings() {

    try {

        // =============================================
        // VERIFICAR SESSÃO
        // =============================================

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabase.auth.getSession();


        if (
            sessionError ||
            !sessionData.session
        ) {

            console.error(
                "Sessão não encontrada:",
                sessionError
            );

            window.location.replace(
                "login.html"
            );

            return;

        }


        currentUser =
            sessionData.session.user;



        // =============================================
        // BUSCAR PROFILE
        // =============================================

        const {
            data: profile,
            error: profileError
        } =
            await supabase
                .from("profiles")
                .select(
                    "company_id"
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

            return;

        }


        if (
            !profile ||
            !profile.company_id
        ) {

            console.error(
                "Empresa não vinculada ao usuário."
            );

            return;

        }


        currentCompanyId =
            profile.company_id;



        // =============================================
        // BUSCAR EMPRESA
        // =============================================

        const {
            data: company,
            error: companyError
        } =
            await supabase
                .from("companies")
                .select(
                    "id, name, plan"
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

            return;

        }



        // =============================================
        // PREENCHER NOME DA EMPRESA
        // =============================================

        originalCompanyName =
            company.name || "";


        if (businessNameInput) {

            businessNameInput.value =
                originalCompanyName;

        }



        // =============================================
        // ATUALIZAR EMPRESA DA SIDEBAR
        // =============================================

        updateCompanyInterface(
            company.name,
            company.plan
        );


    } catch (error) {

        console.error(
            "Erro inesperado ao carregar configurações:",
            error
        );

    }

}



// =========================================================
// SALVAR NOME DA EMPRESA
// =========================================================

if (saveButton) {

    saveButton.addEventListener(
        "click",
        async () => {

            const companyName =
                businessNameInput
                    ?.value
                    .trim();


            // =============================================
            // VALIDAR
            // =============================================

            if (
                !companyName ||
                companyName.length < 2
            ) {

                showButtonMessage(
                    "Informe o nome da empresa",
                    "error"
                );

                businessNameInput?.focus();

                return;

            }


            if (!currentCompanyId) {

                showButtonMessage(
                    "Empresa não encontrada",
                    "error"
                );

                return;

            }



            // =============================================
            // NÃO HOUVE ALTERAÇÃO
            // =============================================

            if (
                companyName ===
                originalCompanyName
            ) {

                showButtonMessage(
                    "Nenhuma alteração"
                );

                return;

            }



            // =============================================
            // LOADING
            // =============================================

            setSaveLoading(true);


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
                            "id, name, plan"
                        )
                        .single();



                if (error) {

                    console.error(
                        "Erro ao atualizar empresa:",
                        error
                    );


                    showButtonMessage(
                        "Erro ao salvar",
                        "error"
                    );

                    return;

                }



                // =============================================
                // SALVO
                // =============================================

                originalCompanyName =
                    data.name;


                businessNameInput.value =
                    data.name;


                updateCompanyInterface(
                    data.name,
                    data.plan
                );


                showButtonMessage(
                    "Alterações salvas ✓",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Erro inesperado ao salvar:",
                    error
                );


                showButtonMessage(
                    "Erro ao salvar",
                    "error"
                );


            } finally {

                setSaveLoading(false);

            }

        }
    );

}



// =========================================================
// ESTADO DO BOTÃO
// =========================================================

function setSaveLoading(
    loading
) {

    if (!saveButton) {
        return;
    }


    saveButton.disabled =
        loading;


    if (loading) {

        saveButton.textContent =
            "Salvando...";

    }

}



// =========================================================
// MENSAGEM NO BOTÃO
// =========================================================

function showButtonMessage(
    text,
    type = "normal"
) {

    if (!saveButton) {
        return;
    }


    saveButton.disabled =
        true;


    saveButton.textContent =
        text;


    if (type === "error") {

        saveButton.style.opacity =
            "0.8";

    } else {

        saveButton.style.opacity =
            "1";

    }


    setTimeout(
        () => {

            saveButton.textContent =
                "Salvar alterações";

            saveButton.disabled =
                false;

            saveButton.style.opacity =
                "";

        },
        1600
    );

}



// =========================================================
// ATUALIZAR INTERFACE DA EMPRESA
// =========================================================

function updateCompanyInterface(
    companyName,
    plan
) {

    // =============================================
    // NOME NA SIDEBAR
    // =============================================

    const sidebarCompanyName =
        document.querySelector(
            ".company-card strong"
        );


    if (sidebarCompanyName) {

        sidebarCompanyName.textContent =
            companyName || "Minha empresa";

    }



    // =============================================
    // INICIAIS DA EMPRESA
    // =============================================

    const companyAvatar =
        document.querySelector(
            ".company-avatar"
        );


    if (companyAvatar) {

        companyAvatar.textContent =
            getInitials(
                companyName
            );

    }



    // =============================================
    // PLANO
    // =============================================

    const companyPlan =
        document.querySelector(
            ".company-card > div:nth-child(2) span"
        );


    if (
        companyPlan &&
        plan
    ) {

        companyPlan.textContent =
            formatPlan(
                plan
            );

    }



    // =============================================
    // OUTRAS APARIÇÕES DO NOME
    // =============================================

    const whatsappCompany =
        document.querySelector(
            ".whatsapp-detail strong"
        );


    if (whatsappCompany) {

        whatsappCompany.textContent =
            companyName || "—";

    }

}



// =========================================================
// INICIAIS
// =========================================================

function getInitials(
    name
) {

    if (!name) {
        return "AI";
    }


    const words =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (
        words.length === 1
    ) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[1][0]
    ).toUpperCase();

}



// =========================================================
// FORMATAR PLANO
// =========================================================

function formatPlan(
    plan
) {

    if (!plan) {
        return "Starter";
    }


    const plans = {

        starter:
            "Starter",

        professional:
            "Professional",

        business:
            "Business"

    };


    return (
        plans[
        plan.toLowerCase()
        ] ||
        plan
    );

}



// =========================================================
// MODAL DE EQUIPE
// =========================================================

const teamModal =
    document.getElementById(
        "team-modal"
    );

const addMemberButton =
    document.getElementById(
        "add-team-member"
    );

const closeTeamModal =
    document.getElementById(
        "close-team-modal"
    );

const cancelTeamModal =
    document.getElementById(
        "cancel-team-modal"
    );

const confirmTeamMember =
    document.getElementById(
        "confirm-team-member"
    );

const teamList =
    document.getElementById(
        "team-list"
    );

const memberName =
    document.getElementById(
        "member-name"
    );

const memberEmail =
    document.getElementById(
        "member-email"
    );

const memberRole =
    document.getElementById(
        "member-role"
    );



// =========================================================
// ABRIR MODAL
// =========================================================

function openTeamModal() {

    if (!teamModal) {
        return;
    }


    teamModal.classList.add(
        "active"
    );


    setTimeout(
        () => {

            memberName?.focus();

        },
        100
    );

}



// =========================================================
// FECHAR MODAL
// =========================================================

function closeTeamModalFunction() {

    if (!teamModal) {
        return;
    }


    teamModal.classList.remove(
        "active"
    );


    if (memberName) {

        memberName.value =
            "";

    }


    if (memberEmail) {

        memberEmail.value =
            "";

    }

}



// =========================================================
// EVENTOS DO MODAL
// =========================================================

if (addMemberButton) {

    addMemberButton.addEventListener(
        "click",
        openTeamModal
    );

}


if (closeTeamModal) {

    closeTeamModal.addEventListener(
        "click",
        closeTeamModalFunction
    );

}


if (cancelTeamModal) {

    cancelTeamModal.addEventListener(
        "click",
        closeTeamModalFunction
    );

}


if (teamModal) {

    teamModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                teamModal
            ) {

                closeTeamModalFunction();

            }

        }
    );

}



// =========================================================
// ADICIONAR MEMBRO - FRONTEND
// =========================================================

if (confirmTeamMember) {

    confirmTeamMember.addEventListener(
        "click",
        () => {

            const name =
                memberName
                    ?.value
                    .trim();

            const email =
                memberEmail
                    ?.value
                    .trim();

            const role =
                memberRole
                    ?.value;


            if (!name) {

                memberName?.focus();

                return;

            }


            if (!email) {

                memberEmail?.focus();

                return;

            }


            const initials =
                name
                    .split(" ")
                    .slice(0, 2)
                    .map(
                        word =>
                            word.charAt(0)
                    )
                    .join("")
                    .toUpperCase();


            const member =
                document.createElement(
                    "div"
                );


            member.className =
                "team-member";


            member.innerHTML = `

                <div class="team-avatar">
                    ${escapeHTML(initials)}
                </div>

                <div class="team-member-info">

                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    <span>
                        ${escapeHTML(email)}
                    </span>

                </div>

                <span class="team-role">
                    ${escapeHTML(role)}
                </span>

            `;


            teamList?.appendChild(
                member
            );


            closeTeamModalFunction();

        }
    );

}



// =========================================================
// WHATSAPP
// AINDA SEM INTEGRAÇÃO REAL
// =========================================================

const disconnectWhatsApp =
    document.getElementById(
        "disconnect-whatsapp"
    );

const reconfigureWhatsApp =
    document.getElementById(
        "reconfigure-whatsapp"
    );

const whatsappStatus =
    document.getElementById(
        "whatsapp-status"
    );


if (disconnectWhatsApp) {

    disconnectWhatsApp.addEventListener(
        "click",
        () => {

            if (whatsappStatus) {

                whatsappStatus.textContent =
                    "Não conectado";

            }

        }
    );

}


if (reconfigureWhatsApp) {

    reconfigureWhatsApp.addEventListener(
        "click",
        () => {

            if (whatsappStatus) {

                whatsappStatus.textContent =
                    "Aguardando integração";

            }

        }
    );

}



// =========================================================
// SEGURANÇA
// =========================================================

function escapeHTML(
    text
) {

    const element =
        document.createElement(
            "div"
        );

    element.textContent =
        text || "";

    return element.innerHTML;

}