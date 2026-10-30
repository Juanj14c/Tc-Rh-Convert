import { NextResponse } from "next/server";
import {createClient as createSessionClient} from "@/lib/supabase/server"
import { error } from "console";

export const runtime = "nodejs";

type EmployeeType= "planta" | "campana";

interface EmployeeRow{
    country_name: string | null;
    area: string | null;
    campaign: string | null;
    employee_type: string | null;
}

function cleanText(value: string | null | undefined): string{
    return (value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeMatch(value: string): string{
    return cleanText(value).toLocaleLowerCase("es");
}

export async function GET(){
    try{
        const db = await createSessionClient();

        const {
            data: {user},
            error: authError,
        }= await db.auth.getUser();

        if(authError || !user){
            return NextResponse.json(
                {error: "Debes iniciar sesión."},
                {status: 401},
            );
        }
    const {
        data: profile,
        error: profileError,
    }= await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

    if(profileError){
        console.error(
            "[quick-tips/options] Error verificando el perfil:",
            profileError.code,
        );

        return NextResponse.json(
            {error: "No se pudieron verificar los permisos."},
            {status: 500},
        );
    }
    if (profile?.role !=="admin"){
        return  NextResponse.json(
            {error: "Solo un administrador puede consultar estas opciones."},
            {status:403},
        );
    }

    const {
        data,
        error,
    }= await db

    .from("employees")
    .select(
        "country_name, area,campaign, employee_type",
    )

    .eq("active", true);

    if(error){
        console.error(
            "[quick-tips/options] Error consultando empleados:",
            {
                code: error.code,
                message: error.message,
            },
        );
        return NextResponse.json(
            {
                error:"No se pudieron cargar las opciones de empleados."},
                {status: 500},
        );
    }
    const rows = (data ?? []) as EmployeeRow[];

    const uniqueOptions = new Map<
    string,
    {
        country: string;
        area: string;
        campaign: string;
        employeeType: EmployeeType;
    }
    >();

    for (const row of rows){
        const country = cleanText(row.country_name);
        const rawEmployeeType = row.employee_type;

        if(
            !country ||
            (rawEmployeeType !== "planta" &&
            rawEmployeeType !== "campana")
        ){
            continue;
        }
        const employeeType : EmployeeType =
        rawEmployeeType as EmployeeType;

        const area=
        employeeType === "planta"
        ? cleanText(row.area)
        :"";

        const campaign =
        employeeType === "campana"
        ? cleanText(row.campaign)
        : "";

        /**
         * Un empleado sin la asignación correspondiente
         * no debe crear una opción vacía.
         */
        if(employeeType === "planta" && !area){
            continue;
        }
        if(employeeType === "campana" && !campaign){
            continue;
        }
        const option = {
            country,
            area,
            campaign,
            employeeType
        };
        const key = [
            normalizeMatch(country),
            employeeType,
            normalizeMatch(area),
            normalizeMatch(campaign),
        ].join("|");

        if(!uniqueOptions.has(key)){
            uniqueOptions.set(key, option);
        }
    }

    const options = Array.from(uniqueOptions.values()).sort(
        (a,b) =>
            a.country.localeCompare(b.country,"es")||
            a.employeeType.localeCompare(b.employeeType, "es") ||
            a.area.localeCompare(b.area, "es") ||
            a.campaign.localeCompare(b.campaign, "es"),
    );
    return NextResponse.json(
        {options},
        {
            headers:{
                "Cache-Control": "no-store",
            },
        },
    );

    }catch(error){
        console.error(
            "[quick-tips/options] Error inesperado:",
            error instanceof Error ? error.message : "Error desconocido",
        );
        return  NextResponse.json(
            {error: "No se pudieron cargar las opciones."},
            {status: 500},
        );
    }
}
