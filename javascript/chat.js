import { supabase } from "./supabase-client.js";

document.addEventListener("DOMContentLoaded", () => {

    const messageInput =
        document.getElementById("message-input");

    const sendButton =
        document.getElementById("send-message-button");

    const aiNotice =
        document.getElementById("ai-answering-notice");

    const messages =
        document.getElementById("support-messages");

    const searchInput =
        document.getElementById("conversation-search");

    const conversationList =
        document.getElementById("support-conversation-list");

    const filterButtons =
        document.querySelectorAll(".conversation-filters button");

    const conversationCount =
        document.querySelector(".conversation-sidebar-header span");

    const activeClientName =
        document.getElementById("active-client-name");

    const detailsClientName =
        document.getElementById("details-client-name");

    const clientContact =
        document.getElementById("client-contact");

    const clientFirstContact =
        document.getElementById("client-first-contact");

    const clientStatus =
        document.getElementById("client-status");

    const clientChannel =
        document.getElementById("client-channel");

    const identifiedInterest =
        document.getElementById(
            "identified-interest"
        );

    const identifiedInterestDescription =
        document.getElementById(
            "identified-interest-description"
        );

    const aiSummary =
        document.getElementById(
            "ai-summary"
        );

    const responsibleAgent =
        document.getElementById("responsible-agent");

    const takeoverButton =
        document.getElementById(
            "takeover-button"
        );

    const finishConversationButton =
        document.getElementById(
            "finish-conversation-button"
        );

    const newTestConversationButton =
        document.getElementById(
            "new-test-conversation-button"
        );




    // =========================================================
    // ESTADO
    // =========================================================

    let isSending =
        false;

    let companyId =
        null;

    let currentConversationId =
        null;

    let currentUser =
        null;

    let conversationData =
        [];

    let currentConversation =
        null;

    let currentFilter =
        "all";

    let currentSearch =
        "";


    // =========================================================
    // INICIALIZAÇÃO
    // =========================================================

    initializeChat();


    async function initializeChat() {

        try {

            setInterfaceLoading(
                true
            );


            // =====================================================
            // SESSÃO
            // =====================================================

            const {
                data: sessionData,
                error: sessionError
            } =
                await supabase.auth.getSession();


            if (sessionError) {

                console.error(
                    "Erro ao carregar sessão:",
                    sessionError
                );

                return;

            }


            const session =
                sessionData?.session;


            if (!session?.user) {

                window.location.href =
                    "login.html";

                return;

            }


            currentUser =
                session.user;


            // =====================================================
            // PERFIL / EMPRESA
            // =====================================================

            const {
                data: profile,
                error: profileError
            } =
                await supabase
                    .from("profiles")
                    .select(`
                        company_id
                    `)
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


            if (!profile?.company_id) {

                console.error(
                    "Empresa do usuário não encontrada."
                );

                return;

            }


            companyId =
                profile.company_id;


            // =====================================================
            // CARREGAR CONVERSAS DA EMPRESA
            // =====================================================

            await loadConversations();


        } catch (error) {

            console.error(
                "Erro ao inicializar chat:",
                error
            );

        } finally {

            setInterfaceLoading(
                false
            );

            updateChatModeInterface(
                currentConversation
            );

        }

    }


    // =========================================================
    // CARREGAR TODAS AS CONVERSAS
    // =========================================================

    async function loadConversations(
        selectConversationId = null
    ) {

        if (!companyId) {
            return;
        }


        const {
            data,
            error
        } =
            await supabase
                .from("conversations")
                .select(`
    id,
    customer_name,
    customer_phone,
    channel,
    status,
    identified_interest,
    ai_summary,
    human_last_activity_at,
    last_message,
    last_message_at,
    created_at,
    updated_at
`)
                .eq(
                    "company_id",
                    companyId
                )
                .order(
                    "last_message_at",
                    {
                        ascending: false,
                        nullsFirst: false
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "Erro ao carregar conversas:",
                error
            );

            showConversationListError();

            return;
        }


        conversationData =
            (data || []).filter(
                conversation =>
                    conversation.status !== "finished"
            );


        updateConversationCount();

        renderConversationList();


        // =====================================================
        // TENTAR MANTER A CONVERSA QUE JÁ ESTAVA ABERTA
        // =====================================================

        let conversationToOpen =
            null;


        if (selectConversationId) {

            conversationToOpen =
                conversationData.find(
                    item =>
                        item.id === selectConversationId
                );

        }


        if (
            !conversationToOpen
            && currentConversationId
        ) {

            conversationToOpen =
                conversationData.find(
                    item =>
                        item.id === currentConversationId
                );

        }


        // =====================================================
        // SE NENHUMA ESTIVER SELECIONADA, ABRIR A PRIMEIRA
        // =====================================================

        if (
            !conversationToOpen
            && conversationData.length > 0
        ) {

            conversationToOpen =
                conversationData[0];

        }


        if (conversationToOpen) {

            await selectConversation(
                conversationToOpen.id,
                false
            );

            return;
        }


        // =====================================================
        // NENHUMA CONVERSA
        // =====================================================

        currentConversationId =
            null;

        currentConversation =
            null;

        clearMessages();

        updateActiveConversationInterface(
            null
        );

    }

    // =========================================================
    // SALVAR INTERESSE IDENTIFICADO
    // =========================================================

    async function saveIdentifiedInterest(
        interest
    ) {

        if (
            !currentConversationId
            || !interest
        ) {
            return;
        }


        const normalizedInterest =
            String(
                interest
            )
                .trim()
                .slice(
                    0,
                    100
                );


        if (!normalizedInterest) {
            return;
        }


        const {
            error
        } =
            await supabase
                .from(
                    "conversations"
                )
                .update(
                    {
                        identified_interest:
                            normalizedInterest
                    }
                )
                .eq(
                    "id",
                    currentConversationId
                )
                .eq(
                    "company_id",
                    companyId
                );


        if (error) {

            console.error(
                "Erro ao salvar interesse identificado:",
                error
            );

            return;

        }


        if (currentConversation) {

            currentConversation.identified_interest =
                normalizedInterest;

        }


        if (identifiedInterest) {

            identifiedInterest.textContent =
                normalizedInterest;

        }


        if (
            identifiedInterestDescription
        ) {

            identifiedInterestDescription.textContent =
                "Interesse identificado automaticamente pela Aion AI.";

        }


        await refreshConversationData();

    }

    // =========================================================
    // SALVAR RESUMO DA IA
    // =========================================================

    async function saveAISummary(
        summary
    ) {

        if (
            !currentConversationId
            || !summary
        ) {
            return;
        }


        const normalizedSummary =
            String(
                summary
            )
                .trim()
                .slice(
                    0,
                    1000
                );


        if (!normalizedSummary) {
            return;
        }


        const {
            error
        } =
            await supabase
                .from(
                    "conversations"
                )
                .update(
                    {
                        ai_summary:
                            normalizedSummary
                    }
                )
                .eq(
                    "id",
                    currentConversationId
                )
                .eq(
                    "company_id",
                    companyId
                );


        if (error) {

            console.error(
                "Erro ao salvar resumo da IA:",
                error
            );

            return;

        }


        if (currentConversation) {

            currentConversation.ai_summary =
                normalizedSummary;

        }


        if (aiSummary) {

            aiSummary.textContent =
                normalizedSummary;

        }


        await refreshConversationData();

    }


    // =========================================================
    // RENDERIZAR LISTA DE CONVERSAS
    // =========================================================

    function renderConversationList() {

        if (!conversationList) {
            return;
        }


        const filteredConversations =
            conversationData.filter(
                conversation => {

                    const name =
                        (
                            conversation.customer_name
                            || "Cliente"
                        )
                            .toLowerCase();


                    const phone =
                        (
                            conversation.customer_phone
                            || ""
                        )
                            .toLowerCase();


                    const message =
                        (
                            conversation.last_message
                            || ""
                        )
                            .toLowerCase();


                    const searchMatches =
                        !currentSearch
                        || name.includes(
                            currentSearch
                        )
                        || phone.includes(
                            currentSearch
                        )
                        || message.includes(
                            currentSearch
                        );


                    let statusMatches =
                        true;


                    if (
                        currentFilter === "ai"
                    ) {

                        statusMatches =
                            conversation.status === "ai";

                    }


                    if (
                        currentFilter === "human"
                    ) {

                        statusMatches =
                            conversation.status === "human"
                            || conversation.status === "transferred";

                    }


                    return (
                        searchMatches
                        && statusMatches
                    );

                }
            );


        if (
            filteredConversations.length === 0
        ) {

            conversationList.innerHTML = `
            <div style="
                min-height: 300px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 30px 20px;
                text-align: center;
            ">
                <div>

                    <div style="
                        width: 48px;
                        height: 48px;
                        margin: 0 auto 14px;
                        display: grid;
                        place-items: center;
                        border-radius: 13px;
                        background: rgba(126, 104, 255, 0.08);
                        color: #8c7cff;
                        font-size: 20px;
                    ">
                        ◉
                    </div>

                    <strong style="
                        display: block;
                        margin-bottom: 7px;
                        color: #e5e7ee;
                        font-size: 12px;
                    ">
                        ${conversationData.length === 0
                    ? "Nenhuma conversa"
                    : "Nenhuma conversa encontrada"
                }
                    </strong>

                    <p style="
                        margin: 0;
                        color: #737b8e;
                        font-size: 10px;
                        line-height: 1.6;
                    ">
                        ${conversationData.length === 0
                    ? "Novos atendimentos aparecerão automaticamente aqui."
                    : "Tente alterar a busca ou os filtros."
                }
                    </p>

                </div>
            </div>
        `;

            return;
        }


        conversationList.innerHTML =
            filteredConversations
                .map(
                    conversation =>
                        createConversationHTML(
                            conversation
                        )
                )
                .join("");


        const conversationElements =
            conversationList
                .querySelectorAll(
                    ".support-conversation"
                );


        conversationElements.forEach(
            element => {

                element.addEventListener(
                    "click",
                    async () => {

                        const conversationId =
                            element.dataset.conversationId;


                        if (!conversationId) {
                            return;
                        }


                        await selectConversation(
                            conversationId
                        );

                    }
                );

            }
        );

    }


    // =========================================================
    // HTML DE UMA CONVERSA DA LISTA
    // =========================================================

    function createConversationHTML(
        conversation
    ) {

        const name =
            conversation.customer_name
            || "Cliente";


        const initials =
            getInitials(
                name
            );


        const lastMessage =
            conversation.last_message
            || "Conversa iniciada";


        const time =
            formatConversationTime(
                conversation.last_message_at
                || conversation.created_at
            );


        const status =
            conversation.status
            || "ai";


        const statusLabel =
            getConversationStatusLabel(
                status
            );


        const activeClass =
            conversation.id
                === currentConversationId
                ? " active"
                : "";


        return `
        <button
            type="button"
            class="support-conversation${activeClass}"
            data-conversation-id="${escapeHTML(conversation.id)}"
            data-status="${escapeHTML(status)}"
            style="
                width: 100%;
                border: 0;
                text-align: left;
                cursor: pointer;
            "
        >

            <div class="support-avatar">
                ${escapeHTML(initials)}
            </div>

            <div style="
                min-width: 0;
                flex: 1;
            ">

                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                ">

                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    <span style="
                        flex-shrink: 0;
                        font-size: 10px;
                        opacity: .65;
                    ">
                        ${escapeHTML(time)}
                    </span>

                </div>

                <p style="
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    margin: 5px 0 7px;
                ">
                    ${escapeHTML(lastMessage)}
                </p>

                <span
                    style="
                        display: inline-flex;
                        align-items: center;
                        padding: 3px 7px;
                        border-radius: 999px;
                        font-size: 9px;
                        background: rgba(126, 104, 255, .10);
                        color: #a99eff;
                    "
                >
                    ${escapeHTML(statusLabel)}
                </span>

            </div>

        </button>
    `;

    }


    // =========================================================
    // SELECIONAR CONVERSA
    // =========================================================

    async function selectConversation(
        conversationId,
        rerenderList = true
    ) {

        const conversation =
            conversationData.find(
                item =>
                    item.id === conversationId
            );


        if (!conversation) {
            return;
        }


        currentConversationId =
            conversation.id;

        currentConversation =
            conversation;


        if (rerenderList) {

            renderConversationList();

        } else {

            highlightCurrentConversation();

        }


        updateActiveConversationInterface(
            conversation
        );

        updateChatModeInterface(
            conversation
        );


        await loadConversationMessages(
            conversation.id
        );

    }


    // =========================================================
    // DESTACAR CONVERSA SELECIONADA
    // =========================================================

    function highlightCurrentConversation() {

        if (!conversationList) {
            return;
        }


        const elements =
            conversationList
                .querySelectorAll(
                    ".support-conversation"
                );


        elements.forEach(
            element => {

                element.classList.toggle(
                    "active",
                    element.dataset.conversationId
                    === currentConversationId
                );

            }
        );

    }


    // =========================================================
    // ATUALIZAR CABEÇALHO / CLIENTE
    // =========================================================

    function updateActiveConversationInterface(
        conversation
    ) {

        if (!conversation) {

            if (activeClientName) {
                activeClientName.textContent =
                    "Nenhuma conversa selecionada";
            }

            if (detailsClientName) {
                detailsClientName.textContent =
                    "Nenhum cliente";
            }

            if (clientContact) {
                clientContact.textContent =
                    "—";
            }

            if (clientFirstContact) {
                clientFirstContact.textContent =
                    "—";
            }

            if (responsibleAgent) {
                responsibleAgent.textContent =
                    "—";
            }

            if (clientStatus) {
                clientStatus.textContent =
                    "—";
            }

            if (clientChannel) {
                clientChannel.textContent =
                    "—";
            }
            if (identifiedInterest) {

                identifiedInterest.textContent =
                    "—";

            }


            if (
                identifiedInterestDescription
            ) {

                identifiedInterestDescription.textContent =
                    "Aguardando identificação durante a conversa.";

            }

            if (aiSummary) {

                aiSummary.textContent =
                    "Aguardando informações suficientes para gerar um resumo.";

            }

            return;
        }


        const name =
            conversation.customer_name
            || "Cliente";


        // NOME
        if (activeClientName) {
            activeClientName.textContent =
                name;
        }


        if (detailsClientName) {
            detailsClientName.textContent =
                name;
        }


        // CONTATO
        if (clientContact) {

            clientContact.textContent =
                conversation.customer_phone
                || "Não informado";

        }


        // PRIMEIRO CONTATO
        if (clientFirstContact) {

            clientFirstContact.textContent =
                formatFirstContact(
                    conversation.created_at
                );

        }


        // RESPONSÁVEL
        if (responsibleAgent) {

            if (conversation.status === "finished") {

                responsibleAgent.textContent =
                    "Atendimento encerrado";

            } else if (
                conversation.status === "human"
                || conversation.status === "transferred"
            ) {

                responsibleAgent.textContent =
                    "Atendente humano";

            } else {

                responsibleAgent.textContent =
                    "Aion AI";

            }

        }


        // STATUS
        if (clientStatus) {

            clientStatus.textContent =
                getConversationFullStatus(
                    conversation.status
                );

        }


        // CANAL
        if (clientChannel) {

            clientChannel.textContent =
                getChannelLabel(
                    conversation.channel
                );

        }


        // =========================================================
        // INTERESSE IDENTIFICADO
        // =========================================================

        if (identifiedInterest) {

            identifiedInterest.textContent =
                conversation.identified_interest
                || "—";

        }


        if (
            identifiedInterestDescription
        ) {

            identifiedInterestDescription.textContent =
                conversation.identified_interest
                    ? "Interesse identificado automaticamente pela Aion AI."
                    : "Aguardando identificação durante a conversa.";

        }

        // =========================================================
        // RESUMO DA IA
        // =========================================================

        if (aiSummary) {

            aiSummary.textContent =
                conversation.ai_summary
                || "Aguardando informações suficientes para gerar um resumo.";

        }

    }

    // =========================================================
    // ATUALIZAR MODO DO ATENDIMENTO
    // =========================================================

    function updateChatModeInterface(
        conversation
    ) {

        const isHuman =
            conversation?.status === "human";

        const isFinished =
            conversation?.status === "finished";


        // =====================================================
        // BOTÃO ASSUMIR / DEVOLVER
        // =====================================================

        if (takeoverButton) {

            takeoverButton.disabled =
                !conversation
                || isFinished;

            takeoverButton.textContent =
                isHuman
                    ? "Devolver para Aion AI"
                    : "Assumir atendimento";

        }


        // =====================================================
        // BOTÃO FINALIZAR
        // =====================================================

        if (finishConversationButton) {

            finishConversationButton.disabled =
                !conversation
                || isFinished;

            finishConversationButton.textContent =
                isFinished
                    ? "Finalizado"
                    : "Finalizar";

        }


        // =====================================================
        // CAMPO DE MENSAGEM
        // =====================================================

        if (messageInput) {

            messageInput.disabled =
                !conversation
                || isFinished;

            if (isFinished) {

                messageInput.placeholder =
                    "Atendimento finalizado.";

            } else if (isHuman) {

                messageInput.placeholder =
                    "Digite uma resposta como atendente...";

            } else {

                messageInput.placeholder =
                    "Digite uma mensagem...";

            }

        }


        // =====================================================
        // BOTÃO ENVIAR
        // =====================================================

        if (sendButton) {

            sendButton.disabled =
                !conversation
                || isFinished;

        }


        // =====================================================
        // AVISO
        // =====================================================

        if (aiNotice) {

            if (isFinished) {

                aiNotice.innerHTML =
                    "<span>✓</span> Atendimento finalizado.";

            } else if (isHuman) {

                aiNotice.innerHTML =
                    "<span>●</span> Atendimento humano ativo.";

            } else {

                aiNotice.innerHTML =
                    "<span>✦</span> Aion AI está respondendo esta conversa.";

            }

        }

    }


    // =========================================================
    // FORMATAR PRIMEIRO CONTATO
    // =========================================================

    function formatFirstContact(
        createdAt
    ) {

        if (!createdAt) {
            return "—";
        }


        const date =
            new Date(
                createdAt
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "—";
        }


        return date.toLocaleString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    // =========================================================
    // STATUS COMPLETO
    // =========================================================

    function getConversationFullStatus(
        status
    ) {

        if (status === "human") {
            return "Atendimento humano";
        }


        if (status === "transferred") {
            return "Transferido";
        }


        if (status === "finished") {
            return "Finalizado";
        }


        return "Em atendimento pela IA";

    }


    // =========================================================
    // CANAL
    // =========================================================

    function getChannelLabel(
        channel
    ) {

        if (channel === "whatsapp") {
            return "WhatsApp";
        }


        if (channel === "web") {
            return "Web";
        }


        return channel
            ? String(channel)
            : "—";

    }


    // =========================================================
    // CONTADOR DE CONVERSAS
    // =========================================================

    function updateConversationCount() {

        if (!conversationCount) {
            return;
        }


        const activeCount =
            conversationData.filter(
                conversation =>
                    conversation.status === "ai"
                    || conversation.status === "human"
                    || conversation.status === "transferred"
            )
                .length;


        if (activeCount === 0) {

            conversationCount.textContent =
                "Nenhuma em atendimento";

            return;
        }


        if (activeCount === 1) {

            conversationCount.textContent =
                "1 em atendimento";

            return;
        }


        conversationCount.textContent =
            `${activeCount} em atendimento`;

    }


    // =========================================================
    // ERRO NA LISTA
    // =========================================================

    function showConversationListError() {

        if (!conversationList) {
            return;
        }


        conversationList.innerHTML = `
        <div style="
            padding: 30px 20px;
            text-align: center;
            color: #8b93a7;
            font-size: 11px;
            line-height: 1.6;
        ">
            Não foi possível carregar
            as conversas.
        </div>
    `;

    }


    // =========================================================
    // STATUS
    // =========================================================

    function getConversationStatusLabel(
        status
    ) {

        if (status === "human") {
            return "Humano";
        }


        if (status === "transferred") {
            return "Transferido";
        }


        if (status === "finished") {
            return "Finalizado";
        }


        return "IA";

    }


    // =========================================================
    // INICIAIS DO CLIENTE
    // =========================================================

    function getInitials(
        name
    ) {

        const parts =
            String(
                name || "Cliente"
            )
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        if (parts.length === 0) {
            return "CL";
        }


        if (parts.length === 1) {

            return parts[0]
                .slice(0, 2)
                .toUpperCase();

        }


        return (
            parts[0][0]
            + parts[parts.length - 1][0]
        )
            .toUpperCase();

    }


    // =========================================================
    // HORÁRIO DA LISTA
    // =========================================================

    function formatConversationTime(
        dateValue
    ) {

        if (!dateValue) {
            return "";
        }


        const date =
            new Date(
                dateValue
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        const now =
            new Date();


        const sameDay =
            date.getDate() === now.getDate()
            && date.getMonth() === now.getMonth()
            && date.getFullYear() === now.getFullYear();


        if (sameDay) {

            return date
                .toLocaleTimeString(
                    "pt-BR",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

        }


        return date
            .toLocaleDateString(
                "pt-BR",
                {
                    day: "2-digit",
                    month: "2-digit"
                }
            );

    }


    // =========================================================
    // CARREGAR MENSAGENS
    // =========================================================

    async function loadConversationMessages(
        conversationId
    ) {

        const {
            data,
            error
        } =
            await supabase
                .from("messages")
                .select(`
                    id,
                    sender_type,
                    content,
                    created_at
                `)
                .eq(
                    "conversation_id",
                    conversationId
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Erro ao carregar mensagens:",
                error
            );

            return;

        }


        clearMessages();


        if (
            !data
            || data.length === 0
        ) {

            return;

        }


        data.forEach(
            item => {

                if (
                    item.sender_type === "customer"
                ) {

                    appendCustomerMessage(
                        item.content,
                        item.created_at
                    );

                    return;

                }


                if (
                    item.sender_type === "ai"
                ) {

                    appendAIMessage(
                        item.content,
                        "Aion AI",
                        item.created_at
                    );

                    return;

                }


                if (
                    item.sender_type === "human"
                ) {

                    appendHumanMessage(
                        item.content,
                        item.created_at
                    );

                }

            }
        );


        scrollMessages();

    }


    // =========================================================
    // CRIAR CONVERSA
    // =========================================================

    async function createConversation() {

        if (!companyId) {

            throw new Error(
                "Empresa não carregada."
            );

        }


        const {
            data,
            error
        } =
            await supabase
                .from("conversations")
                .insert(
                    {
                        company_id:
                            companyId,

                        customer_name:
                            "Cliente",

                        channel:
                            "web",

                        status:
                            "ai",

                        last_message:
                            null,

                        last_message_at:
                            null
                    }
                )
                .select(`
                    id
                `)
                .single();


        if (error) {

            throw error;

        }


        currentConversationId =
            data.id;


        return data.id;

    }

    // =========================================================
    // CRIAR CONVERSA DE TESTE
    // =========================================================

    async function createTestConversation() {

        if (
            !companyId
            || !newTestConversationButton
        ) {
            return;
        }


        newTestConversationButton.disabled =
            true;

        newTestConversationButton.innerHTML =
            "<span>＋</span> Criando...";


        try {

            // Não reutilizar conversa atual
            currentConversationId =
                null;

            currentConversation =
                null;


            // Criar nova conversa
            const conversationId =
                await createConversation();


            // Recarregar lista
            await loadConversations();


            // Abrir a conversa criada
            await selectConversation(
                conversationId
            );


        } catch (error) {

            console.error(
                "Erro ao criar conversa de teste:",
                error
            );


            alert(
                "Não foi possível criar a conversa de teste."
            );

        } finally {

            newTestConversationButton.disabled =
                false;

            newTestConversationButton.innerHTML =
                "<span>＋</span> Nova conversa de teste";

        }

    }


    // =========================================================
    // GARANTIR CONVERSA
    // =========================================================

    async function ensureConversation() {

        if (
            currentConversationId
        ) {

            return currentConversationId;

        }


        return await createConversation();

    }


    // =========================================================
    // SALVAR MENSAGEM
    // =========================================================

    async function saveMessage(
        senderType,
        content
    ) {

        const conversationId =
            await ensureConversation();


        const {
            data,
            error
        } =
            await supabase
                .from("messages")
                .insert(
                    {
                        conversation_id:
                            conversationId,

                        company_id:
                            companyId,

                        sender_type:
                            senderType,

                        content:
                            content
                    }
                )
                .select(`
                    id,
                    created_at
                `)
                .single();


        if (error) {

            throw error;

        }


        return data;

    }


    // =========================================================
    // ATUALIZAR CONVERSA
    // =========================================================

    async function updateConversation(
        lastMessage,
        status = "ai"
    ) {

        if (
            !currentConversationId
        ) {

            return;

        }


        const {
            error
        } =
            await supabase
                .from("conversations")
                .update(
                    {
                        last_message:
                            lastMessage,

                        last_message_at:
                            new Date()
                                .toISOString(),

                        status:
                            status,

                        updated_at:
                            new Date()
                                .toISOString()
                    }
                )
                .eq(
                    "id",
                    currentConversationId
                )
                .eq(
                    "company_id",
                    companyId
                );


        if (error) {

            console.error(
                "Erro ao atualizar conversa:",
                error
            );

        }

    }


    // =========================================================
    // PREPARAR INTERFACE
    // =========================================================

    if (messageInput) {

        messageInput.disabled =
            false;

        messageInput.placeholder =
            "Digite uma mensagem...";

    }


    if (sendButton) {

        sendButton.disabled =
            false;

    }


    if (aiNotice) {

        aiNotice.innerHTML =
            "<span>✦</span> Aion AI está respondendo esta conversa.";

    }


    if (responsibleAgent) {

        responsibleAgent.textContent =
            "Aion AI";

    }



    // =========================================================
    // ASSUMIR ATENDIMENTO
    // =========================================================

    async function takeOverConversation() {

        if (
            !currentConversationId
            || !companyId
            || !currentConversation
        ) {
            return;
        }


        if (
            currentConversation.status === "human"
        ) {
            return;
        }


        if (takeoverButton) {

            takeoverButton.disabled =
                true;

            takeoverButton.textContent =
                "Assumindo...";

        }


        try {

            const {
                error
            } =
                await supabase
                    .from(
                        "conversations"
                    )
                    .update(
                        {

                            status:
                                "human",

                            human_last_activity_at:
                                new Date()
                                    .toISOString(),

                            updated_at:
                                new Date()
                                    .toISOString()

                        }
                    )
                    .eq(
                        "id",
                        currentConversationId
                    )
                    .eq(
                        "company_id",
                        companyId
                    );


            if (error) {
                throw error;
            }


            currentConversation.status =
                "human";


            const localConversation =
                conversationData.find(
                    item =>
                        item.id ===
                        currentConversationId
                );


            if (localConversation) {

                localConversation.status =
                    "human";

            }


            updateActiveConversationInterface(
                currentConversation
            );


            updateChatModeInterface(
                currentConversation
            );


            await refreshConversationData();


        } catch (error) {

            console.error(
                "Erro ao assumir atendimento:",
                error
            );


            if (takeoverButton) {

                takeoverButton.disabled =
                    false;

                takeoverButton.textContent =
                    "Assumir atendimento";

            }

        }

    }

    // =========================================================
    // VERIFICAR EXPIRAÇÃO DO ATENDIMENTO HUMANO
    // =========================================================

    function hasHumanServiceExpired(
        conversation
    ) {

        if (
            !conversation
            || conversation.status !== "human"
            || !conversation.human_last_activity_at
        ) {

            return false;

        }


        const lastHumanActivity =
            new Date(
                conversation.human_last_activity_at
            ).getTime();


        const now =
            Date.now();


        const thirtyMinutes =
            30 * 60 * 1000;


        return (
            now - lastHumanActivity
        ) >= thirtyMinutes;

    }

    // =========================================================
    // DEVOLVER ATENDIMENTO PARA A IA
    // =========================================================

    async function returnConversationToAI() {

        if (
            !currentConversationId
            || !companyId
            || !currentConversation
        ) {
            return;
        }


        if (
            currentConversation.status !== "human"
        ) {
            return;
        }


        if (takeoverButton) {

            takeoverButton.disabled =
                true;

            takeoverButton.textContent =
                "Devolvendo para Aion AI...";

        }


        try {

            const {
                error
            } =
                await supabase
                    .from(
                        "conversations"
                    )
                    .update(
                        {

                            status:
                                "ai",

                            updated_at:
                                new Date()
                                    .toISOString()

                        }
                    )
                    .eq(
                        "id",
                        currentConversationId
                    )
                    .eq(
                        "company_id",
                        companyId
                    );


            if (error) {
                throw error;
            }


            currentConversation.status =
                "ai";


            const localConversation =
                conversationData.find(
                    item =>
                        item.id ===
                        currentConversationId
                );


            if (localConversation) {

                localConversation.status =
                    "ai";

            }


            updateActiveConversationInterface(
                currentConversation
            );


            updateChatModeInterface(
                currentConversation
            );


            await refreshConversationData();


        } catch (error) {

            console.error(
                "Erro ao devolver atendimento para IA:",
                error
            );


            updateChatModeInterface(
                currentConversation
            );

        }

    }

    // =========================================================
    // FINALIZAR ATENDIMENTO
    // =========================================================

    async function finishConversation() {

        if (
            !currentConversationId
            || !companyId
            || !currentConversation
        ) {
            return;
        }


        if (
            currentConversation.status === "finished"
        ) {
            return;
        }


        if (finishConversationButton) {

            finishConversationButton.disabled =
                true;

            finishConversationButton.textContent =
                "Finalizando...";

        }


        try {

            const {
                error
            } =
                await supabase
                    .from(
                        "conversations"
                    )
                    .update(
                        {

                            status:
                                "finished",

                            updated_at:
                                new Date()
                                    .toISOString()

                        }
                    )
                    .eq(
                        "id",
                        currentConversationId
                    )
                    .eq(
                        "company_id",
                        companyId
                    );


            if (error) {
                throw error;
            }


            currentConversation.status =
                "finished";


            const localConversation =
                conversationData.find(
                    item =>
                        item.id ===
                        currentConversationId
                );


            if (localConversation) {

                localConversation.status =
                    "finished";

            }


            updateActiveConversationInterface(
                currentConversation
            );


            updateChatModeInterface(
                currentConversation
            );


            currentConversationId =
                null;

            currentConversation =
                null;

            await loadConversations();


        } catch (error) {

            console.error(
                "Erro ao finalizar atendimento:",
                error
            );


            if (finishConversationButton) {

                finishConversationButton.disabled =
                    false;

                finishConversationButton.textContent =
                    "Finalizar";

            }

        }

    }


    // =========================================================
    // ENVIAR MENSAGEM
    // =========================================================

    async function sendMessage() {

        if (
            isSending
            || !messageInput
            || !sendButton
        ) {

            return;

        }


        const text =
            messageInput.value
                .trim();


        if (!text) {

            return;

        }


        if (!companyId) {

            appendErrorMessage(
                "A empresa ainda está sendo carregada. Tente novamente."
            );

            return;

        }


        messageInput.value =
            "";


        setSendingState(
            true
        );


        try {

            // =================================================
            // RETORNO AUTOMÁTICO PARA A AION AI
            // =================================================

            if (
                currentConversation?.status === "human"
                && hasHumanServiceExpired(
                    currentConversation
                )
            ) {

                const {
                    error: returnToAIError
                } =
                    await supabase
                        .from(
                            "conversations"
                        )
                        .update(
                            {
                                status:
                                    "ai",

                                human_last_activity_at:
                                    null,

                                updated_at:
                                    new Date()
                                        .toISOString()
                            }
                        )
                        .eq(
                            "id",
                            currentConversationId
                        )
                        .eq(
                            "company_id",
                            companyId
                        );


                if (returnToAIError) {

                    throw returnToAIError;

                }


                currentConversation.status =
                    "ai";

                currentConversation.human_last_activity_at =
                    null;


                const localConversation =
                    conversationData.find(
                        item =>
                            item.id ===
                            currentConversationId
                    );


                if (localConversation) {

                    localConversation.status =
                        "ai";

                    localConversation.human_last_activity_at =
                        null;

                }


                updateActiveConversationInterface(
                    currentConversation
                );


                updateChatModeInterface(
                    currentConversation
                );

            }


            // =================================================
            // ATENDIMENTO HUMANO
            // =================================================

            if (
                currentConversation?.status ===
                "human"
            ) {

                const savedHumanMessage =
                    await saveMessage(
                        "human",
                        text
                    );


                appendHumanMessage(
                    text,
                    savedHumanMessage?.created_at
                );


                const humanActivityTime =
                    new Date()
                        .toISOString();


                const {
                    error: humanActivityError
                } =
                    await supabase
                        .from(
                            "conversations"
                        )
                        .update(
                            {
                                last_message:
                                    text,

                                last_message_at:
                                    humanActivityTime,

                                status:
                                    "human",

                                human_last_activity_at:
                                    humanActivityTime,

                                updated_at:
                                    humanActivityTime
                            }
                        )
                        .eq(
                            "id",
                            currentConversationId
                        )
                        .eq(
                            "company_id",
                            companyId
                        );


                if (humanActivityError) {

                    throw humanActivityError;

                }


                currentConversation.human_last_activity_at =
                    humanActivityTime;


                await refreshConversationData();


                return;
            }

            // =================================================
            // SALVAR PERGUNTA DO CLIENTE
            // =================================================

            const savedCustomerMessage =
                await saveMessage(
                    "customer",
                    text
                );


            appendCustomerMessage(
                text,
                savedCustomerMessage?.created_at
            );


            await updateConversation(
                text,
                "ai"
            );

            await refreshConversationData();


            // =================================================
            // LOADING
            // =================================================

            appendLoadingMessage();


            // =================================================
            // CHAMAR EDGE FUNCTION
            // =================================================

            const {
                data,
                error
            } =
                await supabase.functions.invoke(
                    "aion-chat",
                    {
                        body: {

                            message:
                                text,

                            conversation_id:
                                currentConversationId

                        }
                    }
                );


            removeLoadingMessage();


            // =================================================
            // ERRO
            // =================================================

            if (error) {

                console.error(
                    "Erro ao chamar aion-chat:",
                    error
                );


                appendErrorMessage(
                    "Não foi possível obter uma resposta da Aion AI."
                );


                return;

            }


            if (!data) {

                appendErrorMessage(
                    "A Aion AI não retornou uma resposta."
                );


                return;

            }


            if (data.error) {

                console.error(
                    "Erro retornado pela função:",
                    data.error
                );


                appendErrorMessage(
                    data.error
                );


                return;

            }


            if (
                !data.reply
                || typeof data.reply !== "string"
            ) {

                appendErrorMessage(
                    "A Aion AI não conseguiu gerar uma resposta."
                );


                return;

            }

            // =================================================
            // SALVAR INTERESSE IDENTIFICADO
            // =================================================

            if (
                data?.identified_interest
                && currentConversationId
            ) {

                await saveIdentifiedInterest(
                    data.identified_interest
                );

            }


            // =================================================
            // SALVAR RESUMO DA IA
            // =================================================

            if (
                data?.ai_summary
                && currentConversationId
            ) {

                await saveAISummary(
                    data.ai_summary
                );

            }

            // =================================================
            // TRANSFERÊNCIA AUTOMÁTICA PARA HUMANO
            // =================================================

            if (
                data?.handoff_required
                && currentConversationId
                && currentConversation
            ) {

                const {
                    error: handoffError
                } =
                    await supabase
                        .from(
                            "conversations"
                        )
                        .update(
                            {
                                status:
                                    "human",

                                human_last_activity_at:
                                    new Date()
                                        .toISOString(),

                                updated_at:
                                    new Date()
                                        .toISOString()
                            }
                        )
                        .eq(
                            "id",
                            currentConversationId
                        )
                        .eq(
                            "company_id",
                            companyId
                        );


                if (handoffError) {

                    console.error(
                        "Erro ao transferir atendimento automaticamente:",
                        handoffError
                    );

                } else {

                    currentConversation.status =
                        "human";


                    const localConversation =
                        conversationData.find(
                            item =>
                                item.id ===
                                currentConversationId
                        );


                    if (localConversation) {

                        localConversation.status =
                            "human";

                    }


                    updateActiveConversationInterface(
                        currentConversation
                    );


                    updateChatModeInterface(
                        currentConversation
                    );

                }

            }


            // =================================================
            // DEFINIR RESPOSTA FINAL
            // =================================================

            const finalAIReply =
                data?.handoff_required
                    ? (
                        data?.handoff_message
                        || "Vou transferir seu atendimento para uma pessoa da nossa equipe."
                    )
                    : data.reply;


            // =================================================
            // SALVAR RESPOSTA DA IA
            // =================================================

            const savedAIMessage =
                await saveMessage(
                    "ai",
                    finalAIReply
                );


            // =================================================
            // MOSTRAR RESPOSTA
            // =================================================

            appendAIMessage(
                finalAIReply,
                data?.assistant?.name
                || "Aion AI",
                savedAIMessage?.created_at
            );


            // =================================================
            // ATUALIZAR CONVERSA
            // =================================================

            await updateConversation(
                finalAIReply,
                data?.handoff_required
                    ? "human"
                    : "ai"
            );


            // =================================================
            // FINALIZAÇÃO AUTOMÁTICA
            // =================================================



            if (
                data?.finish_required
                && !data?.handoff_required
                && currentConversationId
                && currentConversation
            ) {

                await finishConversation();

                return;

            }


            // =================================================
            // ATUALIZAR LISTA
            // =================================================

            await refreshConversationData();


        } catch (error) {

            removeLoadingMessage();


            console.error(
                "Erro no atendimento:",
                error
            );


            appendErrorMessage(
                "Ocorreu um erro ao processar a conversa."
            );


        } finally {

            setSendingState(
                false
            );

            updateChatModeInterface(
                currentConversation
            );

        }

    }

    // =========================================================
    // ATUALIZAR DADOS DA LISTA SEM REABRIR O CHAT
    // =========================================================

    async function refreshConversationData() {

        if (!companyId) {
            return;
        }


        const {
            data,
            error
        } =
            await supabase
                .from("conversations")
                .select(`
   
    id,
    customer_name,
    customer_phone,
    channel,
    status,
    identified_interest,
    ai_summary,
    human_last_activity_at,
    last_message,
    last_message_at,
    created_at,
    updated_at
`)
                .eq(
                    "company_id",
                    companyId
                )
                .order(
                    "last_message_at",
                    {
                        ascending: false,
                        nullsFirst: false
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "Erro ao atualizar lista de conversas:",
                error
            );

            return;
        }


        conversationData =
            (data || []).filter(
                conversation =>
                    conversation.status !== "finished"
            );


        currentConversation =
            conversationData.find(
                item =>
                    item.id === currentConversationId
            )
            || currentConversation;


        updateConversationCount();

        renderConversationList();

    }


    // =========================================================
    // MENSAGEM DO CLIENTE
    // =========================================================

    function appendCustomerMessage(
        text,
        createdAt = null
    ) {

        if (!messages) {

            return;

        }


        const message =
            document.createElement(
                "div"
            );


        message.className =
            "message-row customer-message";


        message.innerHTML = `
            <div class="message-avatar">
                CL
            </div>

            <div>

                <div class="message-author">
                    <strong>Cliente</strong>
                </div>

                <div class="message-bubble">
                    <p>${escapeHTML(text)}</p>
                </div>

                <span class="message-time">
                    ${formatMessageTime(createdAt)}
                </span>

            </div>
        `;


        messages.appendChild(
            message
        );


        scrollMessages();

    }


    // =========================================================
    // RESPOSTA DA AION
    // =========================================================

    function appendAIMessage(
        text,
        assistantName = "Aion AI",
        createdAt = null
    ) {

        if (!messages) {

            return;

        }


        const safeAssistantName =
            escapeHTML(
                assistantName
                || "Aion AI"
            );


        const message =
            document.createElement(
                "div"
            );


        message.className =
            "message-row ai-message";


        message.innerHTML = `
            <div class="message-avatar ai-avatar">
                AI
            </div>

            <div>

                <div class="message-author">
                    <strong>${safeAssistantName}</strong>
                    <span>IA</span>
                </div>

                <div class="message-bubble">
                    ${formatMessage(text)}
                </div>

                <span class="message-time">
                    ${formatMessageTime(createdAt)}
                </span>

            </div>
        `;


        messages.appendChild(
            message
        );


        scrollMessages();

    }


    // =========================================================
    // MENSAGEM HUMANA
    // =========================================================

    function appendHumanMessage(
        text,
        createdAt = null
    ) {

        if (!messages) {

            return;

        }


        const message =
            document.createElement(
                "div"
            );


        message.className =
            "message-row human-message";


        message.innerHTML = `
            <div class="message-avatar">
                AT
            </div>

            <div>

                <div class="message-author">
                    <strong>Atendente</strong>
                    <span>Humano</span>
                </div>

                <div class="message-bubble">
                    <p>${escapeHTML(text)}</p>
                </div>

                <span class="message-time">
                    ${formatMessageTime(createdAt)}
                </span>

            </div>
        `;


        messages.appendChild(
            message
        );

    }


    // =========================================================
    // ERRO
    // =========================================================

    function appendErrorMessage(
        text
    ) {

        if (!messages) {

            return;

        }


        const message =
            document.createElement(
                "div"
            );


        message.className =
            "message-row ai-message";


        message.innerHTML = `
            <div class="message-avatar">
                !
            </div>

            <div>

                <div class="message-author">
                    <strong>Aion AI</strong>
                    <span>Erro</span>
                </div>

                <div class="message-bubble">
                    <p>${escapeHTML(text)}</p>
                </div>

                <span class="message-time">
                    ${getCurrentTime()}
                </span>

            </div>
        `;


        messages.appendChild(
            message
        );


        scrollMessages();

    }


    // =========================================================
    // LOADING
    // =========================================================

    function appendLoadingMessage() {

        if (!messages) {

            return;

        }


        removeLoadingMessage();


        const message =
            document.createElement(
                "div"
            );


        message.id =
            "aion-loading-message";


        message.className =
            "message-row ai-message";


        message.innerHTML = `
            <div class="message-avatar ai-avatar">
                AI
            </div>

            <div>

                <div class="message-author">
                    <strong>Aion AI</strong>
                    <span>IA</span>
                </div>

                <div class="message-bubble">
                    <p>Preparando uma resposta...</p>
                </div>

            </div>
        `;


        messages.appendChild(
            message
        );


        scrollMessages();

    }


    function removeLoadingMessage() {

        const loading =
            document.getElementById(
                "aion-loading-message"
            );


        if (loading) {

            loading.remove();

        }

    }


    // =========================================================
    // ESTADO DE ENVIO
    // =========================================================

    function setSendingState(
        sending
    ) {

        isSending =
            sending;


        if (sendButton) {

            sendButton.disabled =
                sending;

        }


        if (messageInput) {

            messageInput.disabled =
                sending;

        }


        if (aiNotice) {

            aiNotice.innerHTML =
                sending

                    ? "<span>✦</span> Aion AI está preparando uma resposta..."

                    : "<span>✦</span> Aion AI está respondendo esta conversa.";

        }


        if (
            !sending
            && messageInput
        ) {

            messageInput.focus();

        }

    }


    // =========================================================
    // CARREGAMENTO INICIAL
    // =========================================================

    function setInterfaceLoading(
        loading
    ) {

        if (messageInput) {

            messageInput.disabled =
                loading;

        }


        if (sendButton) {

            sendButton.disabled =
                loading;

        }


        if (
            loading
            && aiNotice
        ) {

            aiNotice.innerHTML =
                "<span>✦</span> Carregando conversa...";

        }


        if (
            !loading
            && aiNotice
        ) {

            aiNotice.innerHTML =
                "<span>✦</span> Aion AI está respondendo esta conversa.";

        }

    }


    // =========================================================
    // LIMPAR CHAT
    // =========================================================

    function clearMessages() {

        if (!messages) {

            return;

        }


        messages.innerHTML =
            "";

    }


    // =========================================================
    // BOTÃO ASSUMIR / DEVOLVER ATENDIMENTO
    // =========================================================

    if (takeoverButton) {

        takeoverButton.addEventListener(
            "click",
            async () => {

                if (
                    currentConversation?.status
                    === "human"
                ) {

                    await returnConversationToAI();

                    return;

                }

                await takeOverConversation();

            }
        );

    }

    // =========================================================
    // BOTÃO FINALIZAR ATENDIMENTO
    // =========================================================

    if (finishConversationButton) {

        finishConversationButton.addEventListener(
            "click",
            finishConversation
        );

    }

    if (newTestConversationButton) {

        newTestConversationButton.addEventListener(
            "click",
            createTestConversation
        );

    }


    // =========================================================
    // BOTÃO ENVIAR
    // =========================================================

    if (sendButton) {

        sendButton.addEventListener(
            "click",
            sendMessage
        );

    }


    // =========================================================
    // ENTER
    // =========================================================

    if (messageInput) {

        messageInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                    && !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );

    }


    // =========================================================
    // BUSCA DE CONVERSAS
    // =========================================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                currentSearch =
                    searchInput.value
                        .toLowerCase()
                        .trim();


                renderConversationList();

            }
        );

    }


    // =========================================================
    // FILTROS
    // =========================================================

    filterButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    filterButtons.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    button.classList.add(
                        "active"
                    );


                    currentFilter =
                        button.dataset.filter
                        || "all";


                    renderConversationList();

                }
            );

        }
    );



    // =========================================================
    // HORÁRIO
    // =========================================================

    function getCurrentTime() {

        return new Date()
            .toLocaleTimeString(
                "pt-BR",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            );

    }


    function formatMessageTime(
        createdAt
    ) {

        if (!createdAt) {

            return getCurrentTime();

        }


        const date =
            new Date(
                createdAt
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return getCurrentTime();

        }


        return date
            .toLocaleTimeString(
                "pt-BR",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            );

    }


    // =========================================================
    // SCROLL
    // =========================================================

    function scrollMessages() {

        if (!messages) {

            return;

        }


        messages.scrollTop =
            messages.scrollHeight;

    }


    // =========================================================
    // SEGURANÇA HTML
    // =========================================================

    function escapeHTML(
        text
    ) {

        const element =
            document.createElement(
                "div"
            );


        element.textContent =
            text ?? "";


        return element.innerHTML;

    }


    // =========================================================
    // FORMATAR RESPOSTA DA IA
    // =========================================================

    function formatMessage(
        text
    ) {

        let formatted =
            escapeHTML(
                text ?? ""
            );


        // NEGRITO
        formatted =
            formatted.replace(
                /\*\*(.+?)\*\*/g,
                "<strong>$1</strong>"
            );


        const paragraphs =
            formatted
                .split(
                    /\n{2,}/
                )
                .map(
                    paragraph =>
                        paragraph.trim()
                )
                .filter(
                    Boolean
                );


        return paragraphs
            .map(
                paragraph => {

                    const content =
                        paragraph.replace(
                            /\n/g,
                            "<br>"
                        );


                    return `<p>${content}</p>`;

                }
            )
            .join("");

    }

});