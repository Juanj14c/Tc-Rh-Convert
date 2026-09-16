"use client";

import { useState } from "react";

import { ArrowLeft, Loader2, Mail } from "lucide-react";

import { useRouter } from "next/navigation";


export default function ForgotPasswordPage(){
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>)=>{
        event.preventDefault();

        if ( isLoading) return;

        setMessage("");
        setError("");

        if (!email.trim()){
            setError("Ingresa tu correo electrónico");
            return;
        }
        setIsLoading(true);

        window.setTimeout(()=>{
            setIsLoading(false);
            setMessage(
                "Si el correo existe, recibirás un enlace para restablecer tu contraseña."
            );
        }, 800)
    };

    return(
        <main className="login-page">
            <section className="login-brand-panel">
                <div className="login-brand-panel__glow login-brand-panel__glow--one"/>
                <div className="login-brand-panel__glow login-brand-panel__glow--two"/>
            <div className="login-brand-panel__content">
                <img 
                src="/assets/brand/simbolo_claro.png" 
                alt="Logo de la empresa" 
                className="login-brand-panel__logo-image" />
                <h1>Tc&Rh Convert</h1>
                <p>
                    Recupera el acceso a tu cuenta de manera segura.
                </p>
                </div>
            </section>
        <section className="login-form-panel">
            <div className="login-form-container">
        <button
        type="button"
        className="login-form__back"
        onClick={()=> router.push("/login")}
        >
            <ArrowLeft size ={17} />
            Volver al inicio de sesión
        </button>
        <div className="login-form-header">
            <span>Tc&Rh Convert</span>
            <h2>Recuperar contraseña</h2>
            <p>
                Introduce tu correo y te enviaremos un enlace para recuperar
                tu contraseña.
            </p>
        </div>
        <form 
        className="login-form"
        onSubmit={handleSubmit}
        
        >
            <label>
                Correo electrónico
                <div className="login-form__input">
                    <Mail size={18} />
                    <input 
                    type="text" 
                    value={email}
                    onChange={(event)=> setEmail(event.target.value)}
                    placeholder="correo@empresa.com"
                    autoComplete="email"
                    required
                    />
                </div>
            </label>
            {error &&(
                <div 
                className="login-form__error"
                role="alert"
                >
                    {error}
                </div>
            )}
            {message &&(
                <div 
                className="login-form__succes"
                role="status"
                >
                    {error}
                </div>
            )}

            <button 
            type="submit"
            className="login-form__submit"
            disabled={isLoading}
            >
                {isLoading ?(
                    <>
                    <Loader2
                    size={18}
                    className="login-form__spinner"
                    />
                    Enviando...
                    </>
                ):(
                    "Enviar enlace"
                )}

            </button>
        </form>


            </div>
        </section>

        </main>
    )
}