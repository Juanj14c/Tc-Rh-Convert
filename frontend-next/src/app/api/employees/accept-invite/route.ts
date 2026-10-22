import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
 //1. Verificar que exista un sesión válida.
 const sessionDb= await createSessionClient();
 const {
    data:{ user},
    error:userError,

}= await sessionDb.auth.getUser();

if( userError || !user){
    return NextResponse.json(
        {error: "Debes iniciar sesión para completar la invitación."},
        {status: 401},
    );
}
//2. Comproba que el usuario tenga un perfil de empleado.

const {data: profile, error: profileError} = await sessionDb
.from("profiles")
.select("role")
.eq("id", user.id)
.maybeSingle();

if(profileError){
    console.error(
        "[api/employees/accept-invite] Error consultando el perfil:",
        profileError.message,
    );
    return NextResponse.json(
        {error: "No se pudo validar tu perfil. Recarga la página e intenta de nuevo."},
        {status: 500},
    );
}
if (!profile || profile.role !== "employee"){
    return NextResponse.json(
        {error: "No tienes un perfil de empleado válido para completar esta invitación"},
        {status: 403},
    )
}
    //3. Obtener el cliente administrativo únicamente en el servidor.

    let admiDb;
    try{
        admiDb= createAdminClient();
    }catch (error){
        console.error(
            "[api/employees/accept-invite] Error configurando Supabase:",
            error instanceof Error ? error.message: "Error desconocido",
        );
        return NextResponse.json(
            {error: "No se pudo conectar con la base de datos."},
            {status: 500},
        );
    }
    //4. Buscar exclusivamente la ficha vinculada al usuario autenticado.

    const {data: employee, error:employeeError} = await admiDb
    .from("employees")
    .select("id,active, invitation_status")
    .eq("profile_id", user.id)
    .maybeSingle();

    if ( employeeError){
        console.error(
            "[api/employees/accept-invite] Error consultando al empleado:",
            employeeError.message,
        );
        return NextResponse.json(
            {error:"No se pudo consultar tu ficha de empleado."},
            {status: 500},
        );
    }
    if(!employee){
        return NextResponse.json(
            {error: "No encontramos una ficha de empleado vinculada a tu cuenta."},
            {status: 404},
        );
    }
if (!employee.active){
    return NextResponse.json(
        {error: "Tu ficha de empleado está inactiva. Contacta con el administrador."},
        {status: 409}
    );
}
const currentStatus = String(
    employee.invitation_status ?? "not_sent",

).trim().toLocaleLowerCase();
// Permitir reintentos sin modificar nuevamente una invitación aceptada.

if ( currentStatus === "accepted"){
    return NextResponse.json({
        succes: true,
        invitationStatus: "accepted",
    });
}
if (!["sent","pending"].includes(currentStatus)){
return NextResponse.json(
    {error: "La invitación no está en  un estado que permita completarla."},
    {status: 409},
);
}
//5. Actualizar únicamente la ficha vinculada a esta sesión.

const {data: updatedEmployee, error:updateError} = await admiDb
.from("employees")
.update({
  invitation_status: "accepted",
update_at: new Date().toISOString(),
})
.eq("id", employee.id)
.eq("profile_id", user.id)
.in("invitation_status", ["sent","pending"])
.select("id, invitation_status")
.maybeSingle();

if(updateError){
    console.error(
        "[api/employees/accept-invite] Error actulizando el estado:",
        updateError.message,
    );
    return NextResponse.json(
        {error: "No se pudo actualizar el estado de tu invitación."},
        {status: 500},
    );
}

if(!updatedEmployee){
    return NextResponse.json(
        {error: "El estado de la invitación cambió. Recarga e inténtalo de nuevo"},
        {status: 400},
    )
}
    return NextResponse.json({
        success: true,
        invitationStatus: updatedEmployee.invitation_status,
    });
}
