import {
    supabase
} from "./supabase-client.js";


// =========================================================
// AION AI
// BASE DE CONHECIMENTO
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeKnowledgeBase();

    }
);


// =========================================================
// ESTADO
// =========================================================

let currentUser = null;
let currentCompanyId = null;

let services = [];
let faqs = [];


// =========================================================
// ELEMENTOS
// =========================================================

const saveButton =
    document.getElementById(
        "save-knowledge"
    );


// EMPRESA

const companyNameInput =
    document.getElementById(
        "company-name"
    );

const companySegmentInput =
    document.getElementById(
        "company-segment"
    );

const companyDescriptionInput =
    document.getElementById(
        "company-description"
    );


// POLÍTICAS

const companyPoliciesInput =
    document.getElementById(
        "company-policies"
    );


// CONTATO

const companyPhoneInput =
    document.getElementById(
        "company-phone"
    );

const companyEmailInput =
    document.getElementById(
        "company-email"
    );

const companyAddressInput =
    document.getElementById(
        "company-address"
    );


// EXTRA

const extraInfoInput =
    document.getElementById(
        "extra-info"
    );


// SERVIÇOS

const addServiceButton =
    document.getElementById(
        "add-service"
    );

const servicesList =
    document.getElementById(
        "services-list"
    );


// FAQ

const addFaqButton =
    document.getElementById(
        "add-faq"
    );

const faqList =
    document.getElementById(
        "faq-list"
    );


// =========================================================
// HORÁRIOS
// =========================================================

const scheduleRows =
    document.querySelectorAll(
        ".schedule-row"
    );

const weekdayInputs =
    scheduleRows[0]
        ?.querySelectorAll(
            'input[type="time"]'
        );

const saturdayInputs =
    scheduleRows[1]
        ?.querySelectorAll(
            'input[type="time"]'
        );

const sundayInputs =
    scheduleRows[2]
        ?.querySelectorAll(
            'input[type="time"]'
        );


// =========================================================
// PAGAMENTOS
// =========================================================

const paymentCheckboxes =
    document.querySelectorAll(
        '.payment-options input[type="checkbox"]'
    );


// =========================================================
// INICIALIZAR
// =========================================================

async function initializeKnowledgeBase() {

    setPageLoading(true);

    try {

        // =============================================
        // SESSÃO
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

            window.location.replace(
                "login.html"
            );

            return;

        }


        currentUser =
            sessionData.session.user;


        // =============================================
        // PROFILE
        // =============================================

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


        if (
            profileError ||
            !profile?.company_id
        ) {

            console.error(
                "Erro ao carregar perfil:",
                profileError
            );

            showSaveMessage(
                "Erro ao carregar perfil"
            );

            return;

        }


        currentCompanyId =
            profile.company_id;


        // =============================================
        // EMPRESA
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


        if (companyNameInput) {

            companyNameInput.value =
                company.name || "";

        }


        updateCompanyInterface(
            company
        );


        // =============================================
        // CARREGAR TUDO
        // =============================================

        await Promise.all([

            loadKnowledgeBase(),

            loadServices(),

            loadFaqs()

        ]);


        updateProgress();


    } catch (error) {

        console.error(
            "Erro ao iniciar Base de Conhecimento:",
            error
        );

    } finally {

        setPageLoading(false);

    }

}


// =========================================================
// CARREGAR BASE PRINCIPAL
// =========================================================

async function loadKnowledgeBase() {

    const {
        data,
        error
    } =
        await supabase
            .from("knowledge_bases")
            .select("*")
            .eq(
                "company_id",
                currentCompanyId
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Erro ao carregar base:",
            error
        );

        return;

    }


    if (!data) {

        return;

    }


    setValue(
        companySegmentInput,
        data.segment
    );

    setValue(
        companyDescriptionInput,
        data.description
    );

    setValue(
        companyPoliciesInput,
        data.policies
    );

    setValue(
        companyPhoneInput,
        data.phone
    );

    setValue(
        companyEmailInput,
        data.email
    );

    setValue(
        companyAddressInput,
        data.address
    );

    setValue(
        extraInfoInput,
        data.extra_info
    );


    // HORÁRIOS

    setTimeValue(
        weekdayInputs?.[0],
        data.weekday_open
    );

    setTimeValue(
        weekdayInputs?.[1],
        data.weekday_close
    );

    setTimeValue(
        saturdayInputs?.[0],
        data.saturday_open
    );

    setTimeValue(
        saturdayInputs?.[1],
        data.saturday_close
    );

    setTimeValue(
        sundayInputs?.[0],
        data.sunday_open
    );

    setTimeValue(
        sundayInputs?.[1],
        data.sunday_close
    );


    // PAGAMENTOS

    if (paymentCheckboxes[0]) {

        paymentCheckboxes[0].checked =
            Boolean(
                data.payment_pix
            );

    }

    if (paymentCheckboxes[1]) {

        paymentCheckboxes[1].checked =
            Boolean(
                data.payment_credit_card
            );

    }

    if (paymentCheckboxes[2]) {

        paymentCheckboxes[2].checked =
            Boolean(
                data.payment_debit_card
            );

    }

    if (paymentCheckboxes[3]) {

        paymentCheckboxes[3].checked =
            Boolean(
                data.payment_cash
            );

    }

    if (paymentCheckboxes[4]) {

        paymentCheckboxes[4].checked =
            Boolean(
                data.payment_boleto
            );

    }

    if (paymentCheckboxes[5]) {

        paymentCheckboxes[5].checked =
            Boolean(
                data.payment_transfer
            );

    }

}


// =========================================================
// CARREGAR SERVIÇOS
// =========================================================

async function loadServices() {

    const {
        data,
        error
    } =
        await supabase
            .from(
                "knowledge_services"
            )
            .select(
                "id, name, description, price, position"
            )
            .eq(
                "company_id",
                currentCompanyId
            )
            .order(
                "position",
                {
                    ascending: true
                }
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar serviços:",
            error
        );

        return;

    }


    services =
        data || [];


    renderServices();

}


// =========================================================
// CARREGAR FAQS
// =========================================================

async function loadFaqs() {

    const {
        data,
        error
    } =
        await supabase
            .from(
                "knowledge_faqs"
            )
            .select(
                "id, question, answer, position"
            )
            .eq(
                "company_id",
                currentCompanyId
            )
            .order(
                "position",
                {
                    ascending: true
                }
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar FAQs:",
            error
        );

        return;

    }


    faqs =
        data || [];


    renderFaqs();

}


// =========================================================
// SALVAR BASE PRINCIPAL
// =========================================================

if (saveButton) {

    saveButton.addEventListener(
        "click",
        async () => {

            if (!currentCompanyId) {

                showSaveMessage(
                    "Empresa não encontrada"
                );

                return;

            }


            const companyName =
                companyNameInput
                    ?.value
                    .trim();


            if (
                !companyName ||
                companyName.length < 2
            ) {

                companyNameInput?.focus();

                showSaveMessage(
                    "Informe o nome da empresa"
                );

                return;

            }


            setSaveLoading(true);


            try {

                // =============================================
                // ATUALIZAR NOME DA EMPRESA
                // =============================================

                const {
                    data: updatedCompany,
                    error: companyError
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


                if (companyError) {

                    throw companyError;

                }


                // =============================================
                // BASE
                // =============================================

                const knowledgeData = {

                    company_id:
                        currentCompanyId,

                    segment:
                        cleanValue(
                            companySegmentInput
                        ),

                    description:
                        cleanValue(
                            companyDescriptionInput
                        ),

                    policies:
                        cleanValue(
                            companyPoliciesInput
                        ),

                    phone:
                        cleanValue(
                            companyPhoneInput
                        ),

                    email:
                        cleanValue(
                            companyEmailInput
                        ),

                    address:
                        cleanValue(
                            companyAddressInput
                        ),

                    extra_info:
                        cleanValue(
                            extraInfoInput
                        ),


                    weekday_open:
                        getTimeValue(
                            weekdayInputs?.[0]
                        ),

                    weekday_close:
                        getTimeValue(
                            weekdayInputs?.[1]
                        ),

                    saturday_open:
                        getTimeValue(
                            saturdayInputs?.[0]
                        ),

                    saturday_close:
                        getTimeValue(
                            saturdayInputs?.[1]
                        ),

                    sunday_open:
                        getTimeValue(
                            sundayInputs?.[0]
                        ),

                    sunday_close:
                        getTimeValue(
                            sundayInputs?.[1]
                        ),


                    payment_pix:
                        Boolean(
                            paymentCheckboxes[0]
                                ?.checked
                        ),

                    payment_credit_card:
                        Boolean(
                            paymentCheckboxes[1]
                                ?.checked
                        ),

                    payment_debit_card:
                        Boolean(
                            paymentCheckboxes[2]
                                ?.checked
                        ),

                    payment_cash:
                        Boolean(
                            paymentCheckboxes[3]
                                ?.checked
                        ),

                    payment_boleto:
                        Boolean(
                            paymentCheckboxes[4]
                                ?.checked
                        ),

                    payment_transfer:
                        Boolean(
                            paymentCheckboxes[5]
                                ?.checked
                        ),

                    updated_at:
                        new Date()
                            .toISOString()

                };


                const {
                    error: knowledgeError
                } =
                    await supabase
                        .from(
                            "knowledge_bases"
                        )
                        .upsert(
                            knowledgeData,
                            {
                                onConflict:
                                    "company_id"
                            }
                        );


                if (knowledgeError) {

                    throw knowledgeError;

                }


                updateCompanyInterface(
                    updatedCompany
                );


                updateProgress();


                showSaveMessage(
                    "Alterações salvas ✓",
                    true
                );


            } catch (error) {

                console.error(
                    "Erro ao salvar base:",
                    error
                );


                showSaveMessage(
                    "Erro ao salvar"
                );


            } finally {

                setSaveLoading(false);

            }

        }
    );

}


// =========================================================
// MODAL SERVIÇO
// =========================================================

const serviceModal =
    document.getElementById(
        "service-modal"
    );

const closeServiceModal =
    document.getElementById(
        "close-service-modal"
    );

const cancelServiceModal =
    document.getElementById(
        "cancel-service-modal"
    );

const confirmService =
    document.getElementById(
        "confirm-service"
    );

const modalServiceName =
    document.getElementById(
        "modal-service-name"
    );

const modalServiceDescription =
    document.getElementById(
        "modal-service-description"
    );

const modalServicePrice =
    document.getElementById(
        "modal-service-price"
    );


function openServiceModal() {

    serviceModal?.classList.add(
        "active"
    );


    setTimeout(
        () => {

            modalServiceName?.focus();

        },
        100
    );

}


function closeServiceModalFunction() {

    serviceModal?.classList.remove(
        "active"
    );


    if (modalServiceName) {

        modalServiceName.value = "";

    }

    if (modalServiceDescription) {

        modalServiceDescription.value = "";

    }

    if (modalServicePrice) {

        modalServicePrice.value = "";

    }

}


addServiceButton?.addEventListener(
    "click",
    openServiceModal
);


closeServiceModal?.addEventListener(
    "click",
    closeServiceModalFunction
);


cancelServiceModal?.addEventListener(
    "click",
    closeServiceModalFunction
);


serviceModal?.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            serviceModal
        ) {

            closeServiceModalFunction();

        }

    }
);


// =========================================================
// ADICIONAR SERVIÇO
// =========================================================

confirmService?.addEventListener(
    "click",
    async () => {

        const name =
            modalServiceName
                ?.value
                .trim();


        const description =
            modalServiceDescription
                ?.value
                .trim();


        const price =
            modalServicePrice
                ?.value
                .trim();


        if (!name) {

            modalServiceName?.focus();

            return;

        }


        if (!currentCompanyId) {

            return;

        }


        confirmService.disabled =
            true;

        confirmService.textContent =
            "Adicionando...";


        try {

            const {
                data,
                error
            } =
                await supabase
                    .from(
                        "knowledge_services"
                    )
                    .insert({

                        company_id:
                            currentCompanyId,

                        name:
                            name,

                        description:
                            description || null,

                        price:
                            price || null,

                        position:
                            services.length

                    })
                    .select(
                        "id, name, description, price, position"
                    )
                    .single();


            if (error) {

                throw error;

            }


            services.push(
                data
            );


            renderServices();

            updateProgress();

            closeServiceModalFunction();


        } catch (error) {

            console.error(
                "Erro ao adicionar serviço:",
                error
            );


        } finally {

            confirmService.disabled =
                false;

            confirmService.textContent =
                "Adicionar serviço";

        }

    }
);


// =========================================================
// RENDERIZAR SERVIÇOS
// =========================================================

function renderServices() {

    if (!servicesList) {

        return;

    }


    if (
        services.length === 0
    ) {

        servicesList.innerHTML = `

            <div style="
                padding: 24px 18px;
                text-align: center;
                color: #747c8f;
                font-size: 11px;
                line-height: 1.6;
            ">

                Nenhum serviço cadastrado ainda.

                <br>

                Clique em

                <strong style="color:#9a8cff;">
                    + Adicionar
                </strong>

                para cadastrar o primeiro.

            </div>

        `;

        return;

    }


    servicesList.innerHTML =
        services
            .map(
                service => `

                    <div
                        class="service-item"
                        data-id="${service.id}"
                    >

                        <div class="service-main">

                            <div>

                                <strong>
                                    ${escapeHTML(
                    service.name
                )}
                                </strong>

                                <p>
                                    ${escapeHTML(
                    service.description ||
                    "Sem descrição"
                )}
                                </p>

                            </div>

                            <span>
                                ${escapeHTML(
                    service.price ||
                    "Sob consulta"
                )}
                            </span>

                        </div>

                        <button
                            type="button"
                            class="remove-item"
                            data-type="service"
                            data-id="${service.id}"
                            title="Remover"
                        >
                            ×
                        </button>

                    </div>

                `
            )
            .join("");


    activateRemoveButtons();

}


// =========================================================
// MODAL FAQ
// =========================================================

const faqModal =
    document.getElementById(
        "faq-modal"
    );

const closeFaqModal =
    document.getElementById(
        "close-faq-modal"
    );

const cancelFaqModal =
    document.getElementById(
        "cancel-faq-modal"
    );

const confirmFaq =
    document.getElementById(
        "confirm-faq"
    );

const modalFaqQuestion =
    document.getElementById(
        "modal-faq-question"
    );

const modalFaqAnswer =
    document.getElementById(
        "modal-faq-answer"
    );


function openFaqModal() {

    faqModal?.classList.add(
        "active"
    );


    setTimeout(
        () => {

            modalFaqQuestion?.focus();

        },
        100
    );

}


function closeFaqModalFunction() {

    faqModal?.classList.remove(
        "active"
    );


    if (modalFaqQuestion) {

        modalFaqQuestion.value = "";

    }

    if (modalFaqAnswer) {

        modalFaqAnswer.value = "";

    }

}


addFaqButton?.addEventListener(
    "click",
    openFaqModal
);


closeFaqModal?.addEventListener(
    "click",
    closeFaqModalFunction
);


cancelFaqModal?.addEventListener(
    "click",
    closeFaqModalFunction
);


faqModal?.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            faqModal
        ) {

            closeFaqModalFunction();

        }

    }
);


// =========================================================
// ADICIONAR FAQ
// =========================================================

confirmFaq?.addEventListener(
    "click",
    async () => {

        const question =
            modalFaqQuestion
                ?.value
                .trim();


        const answer =
            modalFaqAnswer
                ?.value
                .trim();


        if (!question) {

            modalFaqQuestion?.focus();

            return;

        }


        if (!answer) {

            modalFaqAnswer?.focus();

            return;

        }


        if (!currentCompanyId) {

            return;

        }


        confirmFaq.disabled =
            true;

        confirmFaq.textContent =
            "Adicionando...";


        try {

            const {
                data,
                error
            } =
                await supabase
                    .from(
                        "knowledge_faqs"
                    )
                    .insert({

                        company_id:
                            currentCompanyId,

                        question:
                            question,

                        answer:
                            answer,

                        position:
                            faqs.length

                    })
                    .select(
                        "id, question, answer, position"
                    )
                    .single();


            if (error) {

                throw error;

            }


            faqs.push(
                data
            );


            renderFaqs();

            updateProgress();

            closeFaqModalFunction();


        } catch (error) {

            console.error(
                "Erro ao adicionar FAQ:",
                error
            );


        } finally {

            confirmFaq.disabled =
                false;

            confirmFaq.textContent =
                "Adicionar pergunta";

        }

    }
);


// =========================================================
// RENDERIZAR FAQS
// =========================================================

function renderFaqs() {

    if (!faqList) {

        return;

    }


    if (
        faqs.length === 0
    ) {

        faqList.innerHTML = `

            <div style="
                padding: 24px 18px;
                text-align: center;
                color: #747c8f;
                font-size: 11px;
                line-height: 1.6;
            ">

                Nenhuma pergunta frequente cadastrada.

                <br>

                Adicione as principais dúvidas
                dos seus clientes.

            </div>

        `;

        return;

    }


    faqList.innerHTML =
        faqs
            .map(
                faq => `

                    <div
                        class="faq-item"
                        data-id="${faq.id}"
                    >

                        <div>

                            <strong>
                                ${escapeHTML(
                    faq.question
                )}
                            </strong>

                            <p>
                                ${escapeHTML(
                    faq.answer
                )}
                            </p>

                        </div>

                        <button
                            type="button"
                            class="remove-item"
                            data-type="faq"
                            data-id="${faq.id}"
                            title="Remover"
                        >
                            ×
                        </button>

                    </div>

                `
            )
            .join("");


    activateRemoveButtons();

}


// =========================================================
// REMOVER SERVIÇO / FAQ
// =========================================================

function activateRemoveButtons() {

    const buttons =
        document.querySelectorAll(
            ".remove-item"
        );


    buttons.forEach(
        button => {

            button.onclick =
                async () => {

                    const id =
                        button.dataset.id;

                    const type =
                        button.dataset.type;


                    if (
                        !id ||
                        !type
                    ) {

                        return;

                    }


                    button.disabled =
                        true;


                    try {

                        if (
                            type ===
                            "service"
                        ) {

                            const {
                                error
                            } =
                                await supabase
                                    .from(
                                        "knowledge_services"
                                    )
                                    .delete()
                                    .eq(
                                        "id",
                                        id
                                    )
                                    .eq(
                                        "company_id",
                                        currentCompanyId
                                    );


                            if (error) {

                                throw error;

                            }


                            services =
                                services.filter(
                                    service =>
                                        service.id !== id
                                );


                            renderServices();

                        }


                        if (
                            type ===
                            "faq"
                        ) {

                            const {
                                error
                            } =
                                await supabase
                                    .from(
                                        "knowledge_faqs"
                                    )
                                    .delete()
                                    .eq(
                                        "id",
                                        id
                                    )
                                    .eq(
                                        "company_id",
                                        currentCompanyId
                                    );


                            if (error) {

                                throw error;

                            }


                            faqs =
                                faqs.filter(
                                    faq =>
                                        faq.id !== id
                                );


                            renderFaqs();

                        }


                        updateProgress();


                    } catch (error) {

                        console.error(
                            "Erro ao remover item:",
                            error
                        );


                        button.disabled =
                            false;

                    }

                };

        }
    );

}


// =========================================================
// PROGRESSO
// =========================================================

function updateProgress() {

    const items = [

        Boolean(
            companyNameInput
                ?.value
                .trim()
        ),

        Boolean(
            companySegmentInput
                ?.value
                .trim()
        ),

        Boolean(
            companyDescriptionInput
                ?.value
                .trim()
        ),

        services.length > 0,

        hasSchedule(),

        Boolean(
            companyPoliciesInput
                ?.value
                .trim()
        ),

        hasContact(),

        hasPayment(),

        faqs.length > 0,

        Boolean(
            extraInfoInput
                ?.value
                .trim()
        )

    ];


    const completed =
        items.filter(Boolean)
            .length;


    const percentage =
        Math.round(
            (
                completed /
                items.length
            ) * 100
        );


    const progressBar =
        document.querySelector(
            ".knowledge-progress-bar span"
        );


    const progressText =
        document.querySelector(
            ".knowledge-progress-area > strong"
        );


    if (progressBar) {

        progressBar.style.width =
            `${percentage}%`;

    }


    if (progressText) {

        progressText.textContent =
            `${percentage}%`;

    }


    updateCardStatuses();

}


// =========================================================
// STATUS DOS CARDS
// =========================================================

function updateCardStatuses() {

    const cards =
        document.querySelectorAll(
            ".knowledge-card"
        );


    cards.forEach(
        card => {

            const badge =
                card.querySelector(
                    ".knowledge-complete"
                );


            if (!badge) {

                return;

            }


            const hasText =
                Array.from(
                    card.querySelectorAll(
                        "input, textarea"
                    )
                )
                    .some(
                        input =>
                            input.type ===
                                "checkbox"
                                ? input.checked
                                : Boolean(
                                    input.value
                                        ?.trim()
                                )
                    );


            badge.textContent =
                hasText
                    ? "Preenchido"
                    : "Pendente";

        }
    );

}


// =========================================================
// ATUALIZAR EMPRESA NA SIDEBAR
// =========================================================

function updateCompanyInterface(
    company
) {

    if (!company) {

        return;

    }


    const sidebarName =
        document.querySelector(
            ".company-card strong"
        );


    const sidebarAvatar =
        document.querySelector(
            ".company-avatar"
        );


    const sidebarPlan =
        document.querySelector(
            ".company-card > div:nth-child(2) span"
        );


    if (sidebarName) {

        sidebarName.textContent =
            company.name ||
            "Minha empresa";

    }


    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            getInitials(
                company.name
            );

    }


    if (
        sidebarPlan &&
        company.plan
    ) {

        sidebarPlan.textContent =
            formatPlan(
                company.plan
            );

    }

}


// =========================================================
// HELPERS
// =========================================================

function cleanValue(
    element
) {

    const value =
        element
            ?.value
            .trim();


    return value || null;

}


function setValue(
    element,
    value
) {

    if (!element) {

        return;

    }


    element.value =
        value || "";

}


function getTimeValue(
    element
) {

    const value =
        element
            ?.value;


    return value || null;

}


function setTimeValue(
    element,
    value
) {

    if (!element) {

        return;

    }


    if (!value) {

        element.value = "";

        return;

    }


    element.value =
        String(value)
            .substring(
                0,
                5
            );

}


function hasSchedule() {

    return Array.from(
        document.querySelectorAll(
            '.schedule-row input[type="time"]'
        )
    )
        .some(
            input =>
                Boolean(
                    input.value
                )
        );

}


function hasContact() {

    return Boolean(

        companyPhoneInput
            ?.value
            .trim()

        ||

        companyEmailInput
            ?.value
            .trim()

        ||

        companyAddressInput
            ?.value
            .trim()

    );

}


function hasPayment() {

    return Array.from(
        paymentCheckboxes
    )
        .some(
            checkbox =>
                checkbox.checked
        );

}


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
            .substring(
                0,
                2
            )
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[1][0]
    ).toUpperCase();

}


function formatPlan(
    plan
) {

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
        String(plan)
            .toLowerCase()
        ] ||
        plan
    );

}


// =========================================================
// LOADING
// =========================================================

function setPageLoading(
    loading
) {

    if (!saveButton) {

        return;

    }


    if (loading) {

        saveButton.disabled =
            true;

        saveButton.innerHTML =
            "Carregando...";

    } else {

        saveButton.disabled =
            false;

        saveButton.innerHTML =
            "Salvar alterações <span>✓</span>";

    }

}


function setSaveLoading(
    loading
) {

    if (!saveButton) {

        return;

    }


    if (loading) {

        saveButton.disabled =
            true;

        saveButton.innerHTML =
            "Salvando...";

    }

}


// =========================================================
// MENSAGEM
// =========================================================

function showSaveMessage(
    message,
    success = false
) {

    if (!saveButton) {

        return;

    }


    saveButton.innerHTML =
        message;


    if (success) {

        saveButton.classList.add(
            "saved"
        );

    }


    setTimeout(
        () => {

            saveButton.innerHTML =
                "Salvar alterações <span>✓</span>";

            saveButton.classList.remove(
                "saved"
            );

            saveButton.disabled =
                false;

        },
        1800
    );

}


// =========================================================
// ATUALIZAR PROGRESSO ENQUANTO DIGITA
// =========================================================

document
    .querySelectorAll(
        `
        #company-name,
        #company-segment,
        #company-description,
        #company-policies,
        #company-phone,
        #company-email,
        #company-address,
        #extra-info,
        .schedule-row input,
        .payment-options input
        `
    )
    .forEach(
        element => {

            element.addEventListener(
                "input",
                updateProgress
            );

            element.addEventListener(
                "change",
                updateProgress
            );

        }
    );


// =========================================================
// LOGOUT / ALTERAÇÃO DE SESSÃO
// =========================================================

supabase.auth.onAuthStateChange(
    (
        event
    ) => {

        if (
            event ===
            "SIGNED_OUT"
        ) {

            window.location.replace(
                "login.html"
            );

        }

    }
);
// =========================================================
// SEGURANÇA - ESCAPAR HTML
// =========================================================

function escapeHTML(text) {

    const element =
        document.createElement("div");

    element.textContent =
        text ?? "";

    return element.innerHTML;

}