import { supabase } from "./supabase-client.js";

document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // ELEMENTOS
    // =========================================================

    const searchInput =
        document.getElementById(
            "history-search"
        );

    const responsibleFilter =
        document.getElementById(
            "history-responsible-filter"
        );

    const statusFilter =
        document.getElementById(
            "history-status-filter"
        );

    const periodFilter =
        document.getElementById(
            "history-period-filter"
        );

    const tableBody =
        document.getElementById(
            "history-table-body"
        );

    const emptyState =
        document.getElementById(
            "history-empty-state"
        );

    const resultsText =
        document.getElementById(
            "history-results-text"
        );

    const exportButton =
        document.getElementById(
            "history-export"
        );


    // =========================================================
    // MODAL
    // =========================================================

    const modal =
        document.getElementById(
            "history-modal"
        );

    const closeModalButton =
        document.getElementById(
            "history-modal-close"
        );

    const modalName =
        document.getElementById(
            "modal-history-name"
        );

    const modalClient =
        document.getElementById(
            "modal-client"
        );

    const modalPhone =
        document.getElementById(
            "modal-phone"
        );

    const modalResponsible =
        document.getElementById(
            "modal-responsible"
        );

    const modalDuration =
        document.getElementById(
            "modal-duration"
        );

    const modalSummary =
        document.getElementById(
            "history-summary"
        );

    const modalMessages =
        document.getElementById(
            "history-modal-messages"
        );


    // =========================================================
    // ESTADO
    // =========================================================

    let companyId =
        null;

    let conversations =
        [];

    let filteredConversations =
        [];

    let messagesByConversation =
        new Map();


    // =========================================================
    // INICIALIZAÇÃO
    // =========================================================

    initializeHistory();


    async function initializeHistory() {

        try {

            setLoadingState();


            // =================================================
            // SESSÃO
            // =================================================

            const {
                data: sessionData,
                error: sessionError
            } =
                await supabase.auth
                    .getSession();


            if (sessionError) {

                console.error(
                    "Erro ao carregar sessão:",
                    sessionError
                );

                showErrorState(
                    "Não foi possível carregar sua sessão."
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


            // =================================================
            // PERFIL
            // =================================================

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
                        session.user.id
                    )
                    .single();


            if (profileError) {

                console.error(
                    "Erro ao carregar perfil:",
                    profileError
                );

                showErrorState(
                    "Não foi possível identificar sua empresa."
                );

                return;

            }


            if (!profile?.company_id) {

                showErrorState(
                    "Nenhuma empresa vinculada ao usuário."
                );

                return;

            }


            companyId =
                profile.company_id;


            // =================================================
            // CARREGAR DADOS
            // =================================================

            await loadHistory();


        } catch (error) {

            console.error(
                "Erro ao inicializar histórico:",
                error
            );


            showErrorState(
                "Não foi possível carregar o histórico."
            );

        }

    }


    // =========================================================
    // CARREGAR HISTÓRICO
    // =========================================================

    async function loadHistory() {

        if (!companyId) {

            return;

        }


        // =====================================================
        // CONVERSAS
        // =====================================================

        const {
            data: conversationsData,
            error: conversationsError
        } =
            await supabase
                .from("conversations")
                .select(`
                    id,
                    company_id,
                    customer_name,
                    customer_phone,
                    channel,
                    status,
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
                );


        if (conversationsError) {

            console.error(
                "Erro ao carregar conversas:",
                conversationsError
            );


            showErrorState(
                "Não foi possível carregar os atendimentos."
            );

            return;

        }


        conversations =
            conversationsData ?? [];


        // =====================================================
        // MENSAGENS
        // =====================================================

        const {
            data: messagesData,
            error: messagesError
        } =
            await supabase
                .from("messages")
                .select(`
                    id,
                    conversation_id,
                    sender_type,
                    content,
                    created_at
                `)
                .eq(
                    "company_id",
                    companyId
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (messagesError) {

            console.error(
                "Erro ao carregar mensagens:",
                messagesError
            );


            showErrorState(
                "Não foi possível carregar as mensagens."
            );

            return;

        }


        organizeMessages(
            messagesData ?? []
        );


        updateMetrics();


        filterHistory();

    }


    // =========================================================
    // ORGANIZAR MENSAGENS POR CONVERSA
    // =========================================================

    function organizeMessages(
        messages
    ) {

        messagesByConversation =
            new Map();


        messages.forEach(
            message => {

                const conversationId =
                    message.conversation_id;


                if (
                    !messagesByConversation.has(
                        conversationId
                    )
                ) {

                    messagesByConversation.set(
                        conversationId,
                        []
                    );

                }


                messagesByConversation
                    .get(
                        conversationId
                    )
                    .push(
                        message
                    );

            }
        );

    }


    // =========================================================
    // FILTROS
    // =========================================================

    function filterHistory() {

        const search =
            (
                searchInput?.value
                || ""
            )
                .toLowerCase()
                .trim();


        const responsible =
            responsibleFilter?.value
            || "all";


        const status =
            statusFilter?.value
            || "all";


        const period =
            periodFilter?.value
            || "30";


        filteredConversations =
            conversations.filter(
                conversation => {

                    const customerName =
                        (
                            conversation.customer_name
                            || "Cliente"
                        )
                            .toLowerCase();


                    const matchesSearch =
                        customerName.includes(
                            search
                        );


                    const conversationResponsible =
                        getResponsibleType(
                            conversation
                        );


                    const matchesResponsible =
                        responsible === "all"
                        || responsible
                        === conversationResponsible;


                    const matchesStatus =
                        status === "all"
                        || status
                        === conversation.status;


                    const matchesPeriod =
                        isInsidePeriod(
                            conversation,
                            period
                        );


                    return (
                        matchesSearch
                        && matchesResponsible
                        && matchesStatus
                        && matchesPeriod
                    );

                }
            );


        renderHistory();

    }


    // =========================================================
    // PERÍODO
    // =========================================================

    function isInsidePeriod(
        conversation,
        period
    ) {

        const dateValue =
            conversation.last_message_at
            || conversation.created_at;


        if (!dateValue) {

            return false;

        }


        const conversationDate =
            new Date(
                dateValue
            );


        if (
            Number.isNaN(
                conversationDate.getTime()
            )
        ) {

            return false;

        }


        const now =
            new Date();


        if (
            period === "today"
        ) {

            return (
                conversationDate
                    .getFullYear()
                === now.getFullYear()

                && conversationDate
                    .getMonth()
                === now.getMonth()

                && conversationDate
                    .getDate()
                === now.getDate()
            );

        }


        const days =
            Number(
                period
            );


        if (
            Number.isNaN(
                days
            )
        ) {

            return true;

        }


        const limit =
            new Date();


        limit.setDate(
            limit.getDate()
            - days
        );


        return (
            conversationDate
            >= limit
        );

    }


    // =========================================================
    // RENDERIZAR HISTÓRICO
    // =========================================================

    function renderHistory() {

        if (!tableBody) {

            return;

        }


        tableBody.innerHTML =
            "";


        if (
            filteredConversations.length
            === 0
        ) {

            if (emptyState) {

                emptyState.style.display =
                    "flex";

            }


            if (resultsText) {

                resultsText.textContent =
                    conversations.length === 0
                        ? "Nenhum atendimento registrado"
                        : "Nenhum atendimento encontrado";

            }


            return;

        }


        if (emptyState) {

            emptyState.style.display =
                "none";

        }


        filteredConversations.forEach(
            conversation => {

                const row =
                    createHistoryRow(
                        conversation
                    );


                tableBody.appendChild(
                    row
                );

            }
        );


        if (resultsText) {

            const count =
                filteredConversations.length;


            resultsText.textContent =
                count === 1
                    ? "1 atendimento encontrado"
                    : `${count} atendimentos encontrados`;

        }

    }


    // =========================================================
    // CRIAR LINHA
    // =========================================================

    function createHistoryRow(
        conversation
    ) {

        const row =
            document.createElement(
                "tr"
            );


        const customerName =
            conversation.customer_name
            || "Cliente";


        const responsibleType =
            getResponsibleType(
                conversation
            );


        const responsibleLabel =
            getResponsibleLabel(
                conversation
            );


        const statusData =
            getStatusData(
                conversation.status
            );


        const duration =
            calculateConversationDuration(
                conversation.id
            );


        const channel =
            formatChannel(
                conversation.channel
            );


        row.dataset.name =
            customerName;


        row.dataset.responsible =
            responsibleType;


        row.dataset.status =
            conversation.status
            || "";


        row.innerHTML = `
            <td>

                <div class="history-client">

                    <div class="history-client-avatar">
                        ${getInitials(customerName)}
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(customerName)}
                        </strong>

                        <span>
                            ${escapeHTML(
            getLastMessagePreview(
                conversation
            )
        )}
                        </span>

                    </div>

                </div>

            </td>


            <td>

                <div class="history-date">

                    <strong>
                        ${formatDate(
            conversation.last_message_at
            || conversation.created_at
        )}
                    </strong>

                    <span>
                        ${formatTime(
            conversation.last_message_at
            || conversation.created_at
        )}
                    </span>

                </div>

            </td>


            <td>

                <span class="history-responsible ${responsibleType}">
                    ${escapeHTML(responsibleLabel)}
                </span>

            </td>


            <td>

                <span class="history-status ${escapeHTML(
            conversation.status
            || ""
        )}">
                    ${escapeHTML(statusData.label)}
                </span>

            </td>


            <td>
                ${escapeHTML(duration)}
            </td>


            <td>

                <span class="history-channel">
                    ${escapeHTML(channel)}
                </span>

            </td>


            <td>

                <button
                    type="button"
                    class="history-view-button"
                    data-conversation-id="${conversation.id}"
                >
                    Ver conversa
                </button>

            </td>
        `;


        const viewButton =
            row.querySelector(
                ".history-view-button"
            );


        if (viewButton) {

            viewButton.addEventListener(
                "click",
                () => {

                    openConversationModal(
                        conversation
                    );

                }
            );

        }


        return row;

    }


    // =========================================================
    // ABRIR CONVERSA
    // =========================================================

    function openConversationModal(
        conversation
    ) {

        if (!modal) {

            return;

        }


        const customerName =
            conversation.customer_name
            || "Cliente";


        const conversationMessages =
            messagesByConversation.get(
                conversation.id
            )
            || [];


        if (modalName) {

            modalName.textContent =
                customerName;

        }


        if (modalClient) {

            modalClient.textContent =
                customerName;

        }


        if (modalPhone) {

            modalPhone.textContent =
                conversation.customer_phone
                || "Não informado";

        }


        if (modalResponsible) {

            modalResponsible.textContent =
                getResponsibleLabel(
                    conversation
                );

        }


        if (modalDuration) {

            modalDuration.textContent =
                calculateConversationDuration(
                    conversation.id
                );

        }


        if (modalSummary) {

            modalSummary.textContent =
                createConversationSummary(
                    conversation,
                    conversationMessages
                );

        }


        renderModalMessages(
            conversationMessages
        );


        modal.classList.add(
            "active"
        );

    }


    // =========================================================
    // MENSAGENS DO MODAL
    // =========================================================

    function renderModalMessages(
        conversationMessages
    ) {

        if (!modalMessages) {

            return;

        }


        modalMessages.innerHTML =
            "";


        if (
            conversationMessages.length
            === 0
        ) {

            modalMessages.innerHTML = `
                <div style="
                    padding: 20px;
                    color: #747c8e;
                    text-align: center;
                ">
                    Nenhuma mensagem registrada.
                </div>
            `;

            return;

        }


        conversationMessages.forEach(
            message => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.style.marginBottom =
                    "16px";


                item.style.textAlign =
                    message.sender_type
                        === "customer"
                        ? "left"
                        : "right";


                const senderLabel =
                    getSenderLabel(
                        message.sender_type
                    );


                item.innerHTML = `
                    <div style="
                        margin-bottom: 5px;
                        color: #8c7cff;
                        font-size: 11px;
                        font-weight: 700;
                    ">
                        ${escapeHTML(senderLabel)}
                    </div>

                    <div style="
                        display: inline-block;
                        max-width: 85%;
                        padding: 12px 14px;
                        border: 1px solid rgba(126, 104, 255, 0.15);
                        border-radius: 10px;
                        background: rgba(126, 104, 255, 0.06);
                        color: #dfe2eb;
                        font-size: 12px;
                        line-height: 1.7;
                        text-align: left;
                        overflow-wrap: anywhere;
                    ">
                        ${formatMessage(
                    message.content
                )}
                    </div>

                    <div style="
                        margin-top: 5px;
                        color: #626b7d;
                        font-size: 9px;
                    ">
                        ${formatTime(
                    message.created_at
                )}
                    </div>
                `;


                modalMessages.appendChild(
                    item
                );

            }
        );

    }


    // =========================================================
    // RESUMO DETERMINÍSTICO
    // =========================================================

    function createConversationSummary(
        conversation,
        conversationMessages
    ) {

        const total =
            conversationMessages.length;


        const customerMessages =
            conversationMessages.filter(
                item =>
                    item.sender_type
                    === "customer"
            ).length;


        const aiMessages =
            conversationMessages.filter(
                item =>
                    item.sender_type
                    === "ai"
            ).length;


        const humanMessages =
            conversationMessages.filter(
                item =>
                    item.sender_type
                    === "human"
            ).length;


        let text =
            `Atendimento com ${total} ${total === 1 ? "mensagem" : "mensagens"}. `;


        text +=
            `${customerMessages} do cliente, ${aiMessages} da Aion AI`;


        if (
            humanMessages > 0
        ) {

            text +=
                ` e ${humanMessages} de atendimento humano`;

        }


        text += ".";


        if (
            conversation.last_message
        ) {

            text +=
                ` Última mensagem: "${truncateText(
                    conversation.last_message,
                    120
                )}"`;

        }


        return text;

    }


    // =========================================================
    // MÉTRICAS
    // =========================================================

    function updateMetrics() {

        const metricValues =
            document.querySelectorAll(
                ".history-metric > strong"
            );


        if (
            metricValues.length < 4
        ) {

            return;

        }


        const total =
            conversations.length;


        const finishedByAI =
            conversations.filter(
                conversation =>
                    conversation.status
                    === "finished"
                    && getResponsibleType(
                        conversation
                    ) === "ai"
            ).length;


        const transferred =
            conversations.filter(
                conversation =>
                    conversation.status
                    === "transferred"
                    || conversation.status
                    === "human"
            ).length;


        const averageResponseTime =
            calculateAverageAIResponseTime();


        metricValues[0].textContent =
            String(total);


        metricValues[1].textContent =
            String(finishedByAI);


        metricValues[2].textContent =
            String(transferred);


        metricValues[3].textContent =
            averageResponseTime;

    }


    // =========================================================
    // TEMPO MÉDIO DA IA
    // =========================================================

    function calculateAverageAIResponseTime() {

        const responseTimes =
            [];


        messagesByConversation.forEach(
            conversationMessages => {

                for (
                    let index = 0;
                    index < conversationMessages.length - 1;
                    index++
                ) {

                    const current =
                        conversationMessages[
                        index
                        ];


                    const next =
                        conversationMessages[
                        index + 1
                        ];


                    if (
                        current.sender_type
                        !== "customer"
                    ) {

                        continue;

                    }


                    if (
                        next.sender_type
                        !== "ai"
                    ) {

                        continue;

                    }


                    const start =
                        new Date(
                            current.created_at
                        );


                    const end =
                        new Date(
                            next.created_at
                        );


                    const difference =
                        end.getTime()
                        - start.getTime();


                    if (
                        difference >= 0
                    ) {

                        responseTimes.push(
                            difference
                        );

                    }

                }

            }
        );


        if (
            responseTimes.length === 0
        ) {

            return "—";

        }


        const average =
            responseTimes.reduce(
                (total, value) =>
                    total + value,
                0
            )
            / responseTimes.length;


        return formatDurationMilliseconds(
            average
        );

    }


    // =========================================================
    // DURAÇÃO DA CONVERSA
    // =========================================================

    function calculateConversationDuration(
        conversationId
    ) {

        const conversationMessages =
            messagesByConversation.get(
                conversationId
            )
            || [];


        if (
            conversationMessages.length < 2
        ) {

            return "—";

        }


        const firstDate =
            new Date(
                conversationMessages[0]
                    .created_at
            );


        const lastDate =
            new Date(
                conversationMessages[
                    conversationMessages.length - 1
                ].created_at
            );


        const difference =
            lastDate.getTime()
            - firstDate.getTime();


        if (
            difference < 0
            || Number.isNaN(
                difference
            )
        ) {

            return "—";

        }


        return formatDurationMilliseconds(
            difference
        );

    }


    // =========================================================
    // FORMATAR DURAÇÃO
    // =========================================================

    function formatDurationMilliseconds(
        milliseconds
    ) {

        const seconds =
            Math.max(
                0,
                Math.round(
                    milliseconds
                    / 1000
                )
            );


        if (
            seconds < 60
        ) {

            return `${seconds}s`;

        }


        const minutes =
            Math.floor(
                seconds / 60
            );


        const remainingSeconds =
            seconds % 60;


        if (
            minutes < 60
        ) {

            return remainingSeconds
                ? `${minutes}min ${remainingSeconds}s`
                : `${minutes}min`;

        }


        const hours =
            Math.floor(
                minutes / 60
            );


        const remainingMinutes =
            minutes % 60;


        return remainingMinutes
            ? `${hours}h ${remainingMinutes}min`
            : `${hours}h`;

    }


    // =========================================================
    // RESPONSÁVEL
    // =========================================================

    function getResponsibleType(
        conversation
    ) {

        if (
            conversation.status
            === "human"
            || conversation.status
            === "transferred"
        ) {

            return "human";

        }


        return "ai";

    }


    function getResponsibleLabel(
        conversation
    ) {

        return getResponsibleType(
            conversation
        ) === "human"
            ? "Humano"
            : "Aion AI";

    }


    // =========================================================
    // STATUS
    // =========================================================

    function getStatusData(
        status
    ) {

        switch (
        status
        ) {

            case "human":

                return {
                    label:
                        "Atendimento humano"
                };


            case "transferred":

                return {
                    label:
                        "Transferido"
                };


            case "finished":

                return {
                    label:
                        "Finalizado"
                };


            case "ai":

            default:

                return {
                    label:
                        "Em atendimento"
                };

        }

    }


    // =========================================================
    // CANAL
    // =========================================================

    function formatChannel(
        channel
    ) {

        switch (
        channel
        ) {

            case "whatsapp":

                return "WhatsApp";


            case "web":

                return "Web";


            default:

                return channel
                    || "Não informado";

        }

    }


    // =========================================================
    // REMETENTE
    // =========================================================

    function getSenderLabel(
        senderType
    ) {

        switch (
        senderType
        ) {

            case "customer":

                return "Cliente";


            case "human":

                return "Atendente";


            case "ai":

            default:

                return "Aion AI";

        }

    }


    // =========================================================
    // ÚLTIMA MENSAGEM
    // =========================================================

    function getLastMessagePreview(
        conversation
    ) {

        if (
            !conversation.last_message
        ) {

            return "Sem mensagens";

        }


        return truncateText(
            conversation.last_message,
            55
        );

    }


    // =========================================================
    // EVENTOS DOS FILTROS
    // =========================================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterHistory
        );

    }


    if (responsibleFilter) {

        responsibleFilter.addEventListener(
            "change",
            filterHistory
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            filterHistory
        );

    }


    if (periodFilter) {

        periodFilter.addEventListener(
            "change",
            filterHistory
        );

    }


    // =========================================================
    // FECHAR MODAL
    // =========================================================

    function closeHistoryModal() {

        if (!modal) {

            return;

        }


        modal.classList.remove(
            "active"
        );

    }


    if (closeModalButton) {

        closeModalButton.addEventListener(
            "click",
            closeHistoryModal
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeHistoryModal();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
                && modal?.classList.contains(
                    "active"
                )
            ) {

                closeHistoryModal();

            }

        }
    );


    // =========================================================
    // EXPORTAÇÃO
    // =========================================================

    if (exportButton) {

        exportButton.addEventListener(
            "click",
            () => {

                if (
                    filteredConversations.length
                    === 0
                ) {

                    const original =
                        exportButton.textContent;


                    exportButton.textContent =
                        "Nenhum atendimento para exportar";


                    exportButton.disabled =
                        true;


                    setTimeout(
                        () => {

                            exportButton.textContent =
                                original;

                            exportButton.disabled =
                                false;

                        },
                        1500
                    );


                    return;

                }


                exportHistoryCSV();

            }
        );

    }


    // =========================================================
    // EXPORTAR CSV REAL
    // =========================================================

    function exportHistoryCSV() {

        const rows =
            [
                [
                    "Cliente",
                    "Data",
                    "Hora",
                    "Responsável",
                    "Status",
                    "Duração",
                    "Canal",
                    "Última mensagem"
                ]
            ];


        filteredConversations.forEach(
            conversation => {

                const date =
                    conversation.last_message_at
                    || conversation.created_at;


                rows.push(
                    [
                        conversation.customer_name
                        || "Cliente",

                        formatDate(
                            date
                        ),

                        formatTime(
                            date
                        ),

                        getResponsibleLabel(
                            conversation
                        ),

                        getStatusData(
                            conversation.status
                        ).label,

                        calculateConversationDuration(
                            conversation.id
                        ),

                        formatChannel(
                            conversation.channel
                        ),

                        conversation.last_message
                        || ""
                    ]
                );

            }
        );


        const csv =
            rows
                .map(
                    row =>
                        row
                            .map(
                                value =>
                                    `"${String(
                                        value
                                        ?? ""
                                    )
                                        .replace(
                                            /"/g,
                                            '""'
                                        )}"`
                            )
                            .join(";")
                )
                .join("\n");


        const blob =
            new Blob(
                [
                    "\uFEFF",
                    csv
                ],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            `historico-aion-${getFileDate()}.csv`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        const original =
            exportButton.textContent;


        exportButton.textContent =
            "Relatório exportado ✓";


        exportButton.disabled =
            true;


        setTimeout(
            () => {

                exportButton.textContent =
                    original;

                exportButton.disabled =
                    false;

            },
            1600
        );

    }


    // =========================================================
    // ESTADO DE CARREGAMENTO
    // =========================================================

    function setLoadingState() {

        if (tableBody) {

            tableBody.innerHTML =
                "";

        }


        if (emptyState) {

            emptyState.style.display =
                "flex";


            const paragraph =
                emptyState.querySelector(
                    "p"
                );


            const title =
                emptyState.querySelector(
                    "strong"
                );


            if (title) {

                title.textContent =
                    "Carregando atendimentos...";

            }


            if (paragraph) {

                paragraph.textContent =
                    "Buscando as conversas registradas no sistema.";

            }

        }


        if (resultsText) {

            resultsText.textContent =
                "Carregando...";

        }

    }


    // =========================================================
    // ESTADO DE ERRO
    // =========================================================

    function showErrorState(
        message
    ) {

        if (tableBody) {

            tableBody.innerHTML =
                "";

        }


        if (emptyState) {

            emptyState.style.display =
                "flex";


            const title =
                emptyState.querySelector(
                    "strong"
                );


            const paragraph =
                emptyState.querySelector(
                    "p"
                );


            if (title) {

                title.textContent =
                    "Não foi possível carregar o histórico";

            }


            if (paragraph) {

                paragraph.textContent =
                    message;

            }

        }


        if (resultsText) {

            resultsText.textContent =
                "Erro ao carregar atendimentos";

        }

    }


    // =========================================================
    // DATA
    // =========================================================

    function formatDate(
        value
    ) {

        if (!value) {

            return "—";

        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";

        }


        return date.toLocaleDateString(
            "pt-BR"
        );

    }


    function formatTime(
        value
    ) {

        if (!value) {

            return "—";

        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";

        }


        return date.toLocaleTimeString(
            "pt-BR",
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        );

    }


    function getFileDate() {

        const now =
            new Date();


        const year =
            now.getFullYear();


        const month =
            String(
                now.getMonth()
                + 1
            )
                .padStart(
                    2,
                    "0"
                );


        const day =
            String(
                now.getDate()
            )
                .padStart(
                    2,
                    "0"
                );


        return `${year}-${month}-${day}`;

    }


    // =========================================================
    // TEXTO
    // =========================================================

    function truncateText(
        text,
        limit
    ) {

        const value =
            String(
                text
                ?? ""
            );


        if (
            value.length
            <= limit
        ) {

            return value;

        }


        return (
            value.slice(
                0,
                limit
            )
            + "..."
        );

    }


    // =========================================================
    // INICIAIS
    // =========================================================

    function getInitials(
        name
    ) {

        const parts =
            String(
                name
                || "Cliente"
            )
                .trim()
                .split(
                    /\s+/
                )
                .filter(
                    Boolean
                );


        if (
            parts.length === 0
        ) {

            return "CL";

        }


        if (
            parts.length === 1
        ) {

            return parts[0]
                .slice(
                    0,
                    2
                )
                .toUpperCase();

        }


        return (
            parts[0][0]
            + parts[
            parts.length - 1
            ][0]
        )
            .toUpperCase();

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
            text
            ?? "";


        return element.innerHTML;

    }


    // =========================================================
    // FORMATAR MENSAGEM
    // =========================================================

    function formatMessage(
        text
    ) {

        let formatted =
            escapeHTML(
                text
                ?? ""
            );


        formatted =
            formatted.replace(
                /\*\*(.+?)\*\*/g,
                "<strong>$1</strong>"
            );


        return formatted.replace(
            /\n/g,
            "<br>"
        );

    }

});