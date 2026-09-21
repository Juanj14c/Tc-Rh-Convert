"use client"

import { useContext } from "react"

import { ProfileContext } from "@/contexts/profileContext"
import { error } from "console";

export function useProfile(){
    const context =
    useContext(ProfileContext);

    if(!context){

        throw new Error(
            "useProfile debe usarse dentro de ProfilePorvider",
        )
    }
        return context;
}
