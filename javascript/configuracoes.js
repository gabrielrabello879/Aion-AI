import { supabase } from "./supabase-client.js";

document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // ELEMENTOS
    // =========================================================

    const assistantName =
        document.getElementById("assistant-name");

    const introduction =
        document.getElementById("assistant-introduction");

    const tone =
        document.getElementById("tone");

    const handoffRules =
        document.getElementById("handoff-rules");

    const handoffMessage =
        document.getElementById("handoff-message");

    const restrictedTopics =
        document.getElementById("restricted-topics");

    const previewName =
        document.getElementById("preview-name");

    const previewMessage =
        document.getElementById("preview-message");

    const previewPersonality =
        document.getElementById("preview-personality");

    const previewTone =
        document.getElementById("preview-tone");

    const personalityInputs =
        document.querySelectorAll(
            'input[name="personality"]'
        );

    const saveButton =
        document.getElementById("save-ai-settings");

    const pageStatus =
        document.querySelector(".ai-settings-status");


    // =========================================================
    // SWITCHES
    // =========================================================

    const switchInputs =
        document.querySelectorAll(
            ".ai-switch-row input[type='checkbox']"
        );

    const useKnowledgeBase =
        switchInputs[0] || null;

    const admitWhenUnknown =
        switchInputs[1] || null;

    const allowHumanHandoff =
        switchInputs[2] || null;

    const useEmojis =
        switchInputs[3] || null;


    // =========================================================
    // PRÉVIA - STATUS
    // =========================================================

    const previewInfoItems =
        document.querySelectorAll(
            ".ai-preview-info > div"
        );

    const previewKnowledgeStatus =
        previewInfoItems[2]
            ?.querySelector("strong") || null;

    const previewHandoffStatus =
        previewInfoItems[3]
            ?.querySelector("strong") || null;


    // =========================================================
    // ESTADO
    // =========================================================

    let currentCompanyId = null;


    // =========================================================
    // INICIALIZAÇÃO
    // =========================================================

    initializeAISettings();


    async function initializeAISettings() {

        setPageStatus("Carregando configurações...");

        try {

            const {
                data: sessionData,
                error: sessionError
            } =
                await supabase.auth.getSession();

            if (sessionError) {
                throw sessionError;
            }

            const session =
                sessionData?.session;

            if (!session) {

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
                    .select(
                        "company_id"
                    )
                    .eq(
                        "id",
                        session.user.id
                    )
                    .single();


            if (profileError) {
                throw profileError;
            }


            if (!profile?.company_id) {

                throw new Error(
                    "Empresa do usuário não encontrada."
                );

            }


            currentCompanyId =
                profile.company_id;


            // =================================================
            // CARREGAR CONFIGURAÇÕES
            // =================================================

            await loadAISettings();


            setPageStatus(
                "Configuração carregada"
            );

        } catch (error) {

            console.error(
                "Erro ao carregar configurações da IA:",
                error
            );

            setPageStatus(
                "Erro ao carregar configurações"
            );

        }

    }


    // =========================================================
    // CARREGAR CONFIGURAÇÕES
    // =========================================================

    async function loadAISettings() {

        if (!currentCompanyId) {
            return;
        }


        const {
            data,
            error
        } =
            await supabase
                .from("ai_settings")
                .select(`
                    assistant_name,
                    introduction,
                    personality,
                    tone,
                    use_knowledge_base,
                    admit_when_unknown,
                    allow_human_handoff,
                    use_emojis,
                    handoff_rules,
                    handoff_message,
                    restricted_topics
                `)
                .eq(
                    "company_id",
                    currentCompanyId
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        // Ainda não existem configurações salvas.
        // Mantemos os valores padrão do HTML.
        if (!data) {

            updatePreview();

            return;

        }


        // =====================================================
        // IDENTIDADE
        // =====================================================

        if (assistantName) {

            assistantName.value =
                data.assistant_name
                || "Aion";

        }


        if (introduction) {

            introduction.value =
                data.introduction
                || "";

        }


        // =====================================================
        // PERSONALIDADE
        // =====================================================

        const personalityValue =
            data.personality
            || "professional";


        personalityInputs.forEach(
            (input) => {

                input.checked =
                    input.id === personalityValue;

            }
        );


        // Caso o valor salvo seja inválido
        const selectedPersonality =
            document.querySelector(
                'input[name="personality"]:checked'
            );


        if (
            !selectedPersonality
            && personalityInputs[0]
        ) {

            personalityInputs[0].checked =
                true;

        }


        // =====================================================
        // TOM
        // =====================================================

        if (tone) {

            tone.value =
                data.tone
                || "Equilibrado";

        }


        // =====================================================
        // REGRAS
        // =====================================================

        if (useKnowledgeBase) {

            useKnowledgeBase.checked =
                data.use_knowledge_base
                ?? true;

        }


        if (admitWhenUnknown) {

            admitWhenUnknown.checked =
                data.admit_when_unknown
                ?? true;

        }


        if (allowHumanHandoff) {

            allowHumanHandoff.checked =
                data.allow_human_handoff
                ?? true;

        }


        if (useEmojis) {

            useEmojis.checked =
                data.use_emojis
                ?? false;

        }


        // =====================================================
        // TRANSFERÊNCIA
        // =====================================================

        if (handoffRules) {

            handoffRules.value =
                data.handoff_rules
                || "";

        }


        if (handoffMessage) {

            handoffMessage.value =
                data.handoff_message
                || "";

        }


        // =====================================================
        // RESTRIÇÕES
        // =====================================================

        if (restrictedTopics) {

            restrictedTopics.value =
                data.restricted_topics
                || "";

        }


        // =====================================================
        // ATUALIZA PRÉVIA
        // =====================================================

        updatePreview();

    }


    // =========================================================
    // NOME
    // =========================================================

    if (assistantName) {

        assistantName.addEventListener(
            "input",
            () => {

                updatePreview();

            }
        );

    }


    // =========================================================
    // APRESENTAÇÃO
    // =========================================================

    if (introduction) {

        introduction.addEventListener(
            "input",
            () => {

                updatePreview();

            }
        );

    }


    // =========================================================
    // PERSONALIDADE
    // =========================================================

    personalityInputs.forEach(
        (input) => {

            input.addEventListener(
                "change",
                () => {

                    updatePreview();

                }
            );

        }
    );


    // =========================================================
    // TOM
    // =========================================================

    if (tone) {

        tone.addEventListener(
            "change",
            () => {

                updatePreview();

            }
        );

    }


    // =========================================================
    // SWITCHES
    // =========================================================

    switchInputs.forEach(
        (input) => {

            input.addEventListener(
                "change",
                () => {

                    updatePreview();

                }
            );

        }
    );


    // =========================================================
    // ATUALIZAR PRÉVIA
    // =========================================================

    function updatePreview() {

        // =====================================================
        // NOME
        // =====================================================

        if (previewName) {

            previewName.textContent =
                assistantName?.value.trim()
                || "Assistente";

        }


        // =====================================================
        // MENSAGEM
        // =====================================================

        if (previewMessage) {

            previewMessage.textContent =
                introduction?.value.trim()
                || "Olá! Como posso ajudar?";

        }


        // =====================================================
        // PERSONALIDADE
        // =====================================================

        const selected =
            document.querySelector(
                'input[name="personality"]:checked'
            );


        if (
            selected
            && previewPersonality
        ) {

            const label =
                document.querySelector(
                    `label[for="${selected.id}"] strong`
                );


            previewPersonality.textContent =
                label?.textContent.trim()
                || "Profissional";

        }


        // =====================================================
        // TOM
        // =====================================================

        if (
            tone
            && previewTone
        ) {

            previewTone.textContent =
                tone.value;

        }


        // =====================================================
        // BASE DE CONHECIMENTO
        // =====================================================

        if (previewKnowledgeStatus) {

            previewKnowledgeStatus.textContent =
                useKnowledgeBase?.checked
                    ? "Ativa"
                    : "Desativada";

        }


        // =====================================================
        // TRANSFERÊNCIA HUMANA
        // =====================================================

        if (previewHandoffStatus) {

            previewHandoffStatus.textContent =
                allowHumanHandoff?.checked
                    ? "Ativada"
                    : "Desativada";

        }

    }


    // =========================================================
    // SALVAR
    // =========================================================

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            async () => {

                if (!currentCompanyId) {

                    showSaveError(
                        "Empresa não encontrada"
                    );

                    return;

                }


                const selectedPersonality =
                    document.querySelector(
                        'input[name="personality"]:checked'
                    );


                const assistantNameValue =
                    assistantName?.value.trim()
                    || "Aion";


                // =================================================
                // DADOS
                // =================================================

                const settingsData = {

                    company_id:
                        currentCompanyId,

                    assistant_name:
                        assistantNameValue,

                    introduction:
                        cleanValue(
                            introduction?.value
                        ),

                    personality:
                        selectedPersonality?.id
                        || "professional",

                    tone:
                        tone?.value
                        || "Equilibrado",

                    use_knowledge_base:
                        useKnowledgeBase?.checked
                        ?? true,

                    admit_when_unknown:
                        admitWhenUnknown?.checked
                        ?? true,

                    allow_human_handoff:
                        allowHumanHandoff?.checked
                        ?? true,

                    use_emojis:
                        useEmojis?.checked
                        ?? false,

                    handoff_rules:
                        cleanValue(
                            handoffRules?.value
                        ),

                    handoff_message:
                        cleanValue(
                            handoffMessage?.value
                        ),

                    restricted_topics:
                        cleanValue(
                            restrictedTopics?.value
                        ),

                    updated_at:
                        new Date().toISOString()

                };


                try {

                    setSaveLoading(true);


                    const {
                        error
                    } =
                        await supabase
                            .from("ai_settings")
                            .upsert(
                                settingsData,
                                {
                                    onConflict:
                                        "company_id"
                                }
                            );


                    if (error) {
                        throw error;
                    }


                    showSaveSuccess();


                    setPageStatus(
                        "Configuração salva"
                    );


                } catch (error) {

                    console.error(
                        "Erro ao salvar configurações da IA:",
                        error
                    );


                    showSaveError(
                        "Erro ao salvar"
                    );


                    setPageStatus(
                        "Erro ao salvar configuração"
                    );

                }

            }
        );

    }


    // =========================================================
    // BOTÃO - CARREGANDO
    // =========================================================

    function setSaveLoading(loading) {

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
    // SUCESSO
    // =========================================================

    function showSaveSuccess() {

        if (!saveButton) {
            return;
        }


        saveButton.disabled =
            true;


        saveButton.textContent =
            "Configurações salvas ✓";


        setTimeout(
            () => {

                saveButton.textContent =
                    "Salvar configurações";

                saveButton.disabled =
                    false;

            },
            1600
        );

    }


    // =========================================================
    // ERRO
    // =========================================================

    function showSaveError(message) {

        if (!saveButton) {
            return;
        }


        saveButton.disabled =
            true;


        saveButton.textContent =
            message;


        setTimeout(
            () => {

                saveButton.textContent =
                    "Salvar configurações";

                saveButton.disabled =
                    false;

            },
            2000
        );

    }


    // =========================================================
    // STATUS DA PÁGINA
    // =========================================================

    function setPageStatus(text) {

        if (!pageStatus) {
            return;
        }


        pageStatus.textContent =
            text;

    }


    // =========================================================
    // LIMPAR TEXTO
    // =========================================================

    function cleanValue(value) {

        const text =
            String(
                value ?? ""
            ).trim();


        return text || null;

    }


    // =========================================================
    // MUDANÇA DE AUTENTICAÇÃO
    // =========================================================

    supabase.auth.onAuthStateChange(
        (
            event,
            session
        ) => {

            if (
                event === "SIGNED_OUT"
                || !session
            ) {

                window.location.href =
                    "login.html";

            }

        }
    );

});