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
// ELEMENTOS
// =========================================================

const sidebar =
    document.getElementById("sidebar");

const openButton =
    document.getElementById("sidebar-open");

const closeButton =
    document.getElementById("sidebar-close");

const overlay =
    document.getElementById("sidebar-overlay");


const dateElement =
    document.getElementById("dashboard-date");

const welcomeTitle =
    document.getElementById("welcome-title");


const companyNameElement =
    document.getElementById("company-name");

const companyPlanElement =
    document.getElementById("company-plan");

const companyAvatarElement =
    document.getElementById("company-avatar");


const sidebarUserName =
    document.getElementById("sidebar-user-name");

const sidebarUserRole =
    document.getElementById("sidebar-user-role");

const sidebarUserAvatar =
    document.getElementById("sidebar-user-avatar");

const headerUserAvatar =
    document.getElementById("header-user-avatar");


const logoutButton =
    document.getElementById("logout-button");



// =========================================================
// SIDEBAR MOBILE
// =========================================================

function openSidebar() {

    if (
        !sidebar ||
        !overlay
    ) {
        return;
    }


    sidebar.classList.add("active");

    overlay.classList.add("active");

}



function closeSidebar() {

    if (
        !sidebar ||
        !overlay
    ) {
        return;
    }


    sidebar.classList.remove("active");

    overlay.classList.remove("active");

}



if (openButton) {

    openButton.addEventListener(
        "click",
        openSidebar
    );

}



if (closeButton) {

    closeButton.addEventListener(
        "click",
        closeSidebar
    );

}



if (overlay) {

    overlay.addEventListener(
        "click",
        closeSidebar
    );

}



// =========================================================
// DATA ATUAL
// =========================================================

function updateCurrentDate() {

    if (!dateElement) {
        return;
    }


    const currentDate =
        new Date();


    const formattedDate =
        currentDate.toLocaleDateString(
            "pt-BR",
            {
                weekday: "long",
                day: "2-digit",
                month: "long"
            }
        );


    dateElement.textContent =
        formattedDate;

}



// =========================================================
// SAUDAÇÃO
// =========================================================

function getGreeting() {

    const hour =
        new Date().getHours();


    if (
        hour >= 5 &&
        hour < 12
    ) {

        return "Bom dia";

    }


    if (
        hour >= 12 &&
        hour < 18
    ) {

        return "Boa tarde";

    }


    return "Boa noite";

}



// =========================================================
// PRIMEIRO NOME
// =========================================================

function getFirstName(fullName) {

    if (!fullName) {
        return "Administrador";
    }


    return fullName
        .trim()
        .split(/\s+/)[0];

}



// =========================================================
// INICIAIS
// =========================================================

function getInitials(name) {

    if (!name) {
        return "--";
    }


    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}



// =========================================================
// FORMATAR ROLE
// =========================================================

function formatRole(role) {

    switch (role) {

        case "admin":
            return "Administrador";

        case "manager":
            return "Gerente";

        case "agent":
            return "Atendente";

        default:
            return "Usuário";

    }

}



// =========================================================
// FORMATAR PLANO
// =========================================================

function formatPlan(plan) {

    switch (plan) {

        case "starter":
            return "Starter";

        case "professional":
            return "Professional";

        case "business":
            return "Business";

        default:
            return "Starter";

    }

}



// =========================================================
// MOSTRAR DASHBOARD
// =========================================================

function showDashboard() {

    document.body.style.visibility =
        "visible";

}



// =========================================================
// REDIRECIONAR PARA LOGIN
// =========================================================

function redirectToLogin() {

    window.location.replace(
        "login.html"
    );

}



// =========================================================
// VERIFICAR SESSÃO
// =========================================================

async function checkSession() {

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

            redirectToLogin();

            return null;

        }



        if (
            !data.session ||
            !data.session.user
        ) {

            redirectToLogin();

            return null;

        }


        return data.session.user;


    } catch (error) {

        console.error(
            "Erro inesperado ao verificar sessão:",
            error
        );


        redirectToLogin();

        return null;

    }

}



// =========================================================
// CARREGAR PERFIL
// =========================================================

async function loadProfile(user) {

    const {
        data,
        error
    } =
        await supabase
            .from("profiles")
            .select(
                `
                full_name,
                role,
                company_id
                `
            )
            .eq(
                "id",
                user.id
            )
            .single();



    if (error) {

        console.error(
            "Erro ao carregar perfil:",
            error
        );

        throw error;

    }


    return data;

}



// =========================================================
// CARREGAR EMPRESA
// =========================================================

async function loadCompany(companyId) {

    if (!companyId) {

        return null;

    }


    const {
        data,
        error
    } =
        await supabase
            .from("companies")
            .select(
                `
                id,
                name,
                plan
                `
            )
            .eq(
                "id",
                companyId
            )
            .single();



    if (error) {

        console.error(
            "Erro ao carregar empresa:",
            error
        );

        throw error;

    }


    return data;

}



// =========================================================
// ATUALIZAR USUÁRIO NA INTERFACE
// =========================================================

function updateUserInterface(profile) {

    const fullName =
        profile?.full_name ||
        "Administrador";


    const firstName =
        getFirstName(fullName);


    const initials =
        getInitials(fullName);


    const role =
        formatRole(
            profile?.role
        );



    if (sidebarUserName) {

        sidebarUserName.textContent =
            firstName;

    }


    if (sidebarUserRole) {

        sidebarUserRole.textContent =
            role;

    }


    if (sidebarUserAvatar) {

        sidebarUserAvatar.textContent =
            initials;

    }


    if (headerUserAvatar) {

        headerUserAvatar.textContent =
            initials;

    }


    if (welcomeTitle) {

        welcomeTitle.textContent =
            `${getGreeting()}, ${firstName}.`;

    }

}



// =========================================================
// ATUALIZAR EMPRESA NA INTERFACE
// =========================================================

function updateCompanyInterface(company) {

    if (!company) {

        if (companyNameElement) {

            companyNameElement.textContent =
                "Minha empresa";

        }


        if (companyPlanElement) {

            companyPlanElement.textContent =
                "Starter";

        }


        if (companyAvatarElement) {

            companyAvatarElement.textContent =
                "ME";

        }


        return;

    }



    if (companyNameElement) {

        companyNameElement.textContent =
            company.name;

    }


    if (companyPlanElement) {

        companyPlanElement.textContent =
            formatPlan(
                company.plan
            );

    }


    if (companyAvatarElement) {

        companyAvatarElement.textContent =
            getInitials(
                company.name
            );

    }

}



// =========================================================
// LOGOUT
// =========================================================

async function logout() {

    if (!logoutButton) {
        return;
    }


    logoutButton.disabled =
        true;


    try {


        const {
            error
        } =
            await supabase.auth.signOut();



        if (error) {

            console.error(
                "Erro ao sair:",
                error
            );


            logoutButton.disabled =
                false;

            return;

        }



        window.location.replace(
            "login.html"
        );


    } catch (error) {

        console.error(
            "Erro inesperado no logout:",
            error
        );


        logoutButton.disabled =
            false;

    }

}



if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logout
    );

}



// =========================================================
// DETECTAR ALTERAÇÕES NA AUTENTICAÇÃO
// =========================================================

supabase.auth.onAuthStateChange(
    (event, session) => {

        if (
            event === "SIGNED_OUT" ||
            !session
        ) {

            redirectToLogin();

        }

    }
);



// =========================================================
// INICIALIZAÇÃO DO DASHBOARD
// =========================================================

async function initializeDashboard() {

    updateCurrentDate();


    const user =
        await checkSession();


    if (!user) {

        return;

    }



    try {


        // =============================================
        // PERFIL
        // =============================================

        const profile =
            await loadProfile(
                user
            );


        updateUserInterface(
            profile
        );



        // =============================================
        // EMPRESA
        // =============================================

        const company =
            await loadCompany(
                profile.company_id
            );


        updateCompanyInterface(
            company
        );



        // =============================================
        // MOSTRAR PÁGINA
        // =============================================

        showDashboard();


    } catch (error) {

        console.error(
            "Erro ao inicializar Dashboard:",
            error
        );


        /*
         * O usuário está autenticado,
         * mas houve erro ao carregar os dados.
         *
         * Mostramos a página para não deixar
         * a tela permanentemente invisível.
         */

        showDashboard();

    }

}



// =========================================================
// INICIAR
// =========================================================

initializeDashboard();