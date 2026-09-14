import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// =========================================================
// CONFIGURAÇÃO DO SUPABASE
// =========================================================

// COPIE AQUI A MESMA URL E A MESMA CHAVE PÚBLICA
// QUE JÁ ESTÃO FUNCIONANDO NO SEU login.js.

const SUPABASE_URL =
    "https://ljgdbbgqlfowtaxncnox.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_zH7VBWc-LCytzYgk3eb-7Q_FOAcmfdT";


export const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );