import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient{
    const supabaseUrl=
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey= process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl){
        throw new Error(
            "Flata configurar la URL de Supabase en las variables del servido."
        );
    }

    if(!serviceRoleKey){
        throw new Error(
            "Falta configurar la clave de servicio de supabase en el servidor."
        );
    }

    if(!adminClient){
        adminClient= createClient(supabaseUrl,serviceRoleKey,{
            auth :{
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl:false,
            },
        });
    }
    return adminClient;
}