import React, { useState } from "react";
import { ArrowLeft, Loader2,Mail } from "lucide-react";

interface ForgotPasswordPropos{
    onBack: () => void;
}

function ForgotPassaword({onBack}: ForgotPasswordPropos){
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [ message, setMesseage] = useState("");
    const [error, setError] = useState("");
    const handleSubmit =  (event: React.FormEvent<HTMLFormElement>)=>{
        event.preventDefault();
        if (isLoading){
            return;
        }
        setMesseage("");
        setError("");

        if(!email.trim()){
            setError("Ingresa tu correo electrónico.");
            return
        }
        setIsLoading (true);

        //temporal:
        //supábase.

        window.setTimeout(()=>{
            setIsLoading(false);
            setMesseage(
                "Si el correo existe, recibirás un enlace restable tu contraseña.",
            );

        }, 800);

    };
    return (
        <main className="login-page">
            <section className="login-brand-panel">
                <div className="login-brand-panel__glow login-brand-panel__glow--one"/>
                <div className="login-brand-panel__glow login-brand-panel__glow--two"/>
                <div className="login-brand-panel__content"></div>
                <div className="login-brand-panel__log">
                    TC
                </div>
                <h1>Tc&Rh Convert</h1>
                <p>
                    Recuperar el accesos a tu cuenta de manera segura.
                </p>
            </section>
            <section className="login-form-panel">
                <div className="login-form-container">
                    <button 
                    type="button"
                    className="login-form__back"
                    onClick={onBack}
                    >
                        <ArrowLeft size={17}/>
                        Volver al inicio de sesión
                    </button>
                    <div className="login-form-header">
                    <span>Tc&Rh convert</span>
                    <h2>Recuperar contraseña</h2>
                    <p>
                        Introduce tu correo y te enviaremos un enlace para recuperar tu contraseña
                    </p>
                    </div>
                    <form  
                    className="login-form"
                    onSubmit={handleSubmit}
                    >
                        <label>
                            Correo electrónico
                            <div className="login-form__input">
                            <Mail size ={18} />
                            <input 
                            type="button" 
                            value={email}
                            onChange={(event)=>
                                setEmail(event.target.value)
                            }
                            placeholder="correo@empresa.com"
                            autoComplete="email"
                            required
                            
                            />
                            </div>
                        </label>
                        {error &&(
                            <div className="login-form__error" role="alert">
                                {error}
                            </div>
                        )}
                        {message &&(
                            <div className="login-form__success" role="status">
                                {message}
                            </div>
                        )}
                        <button 
                        type="button"
                        className="login-form__submit"
                        disabled={isLoading}
                    >
                        {isLoading ? (
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
    );
}

export default ForgotPassaword