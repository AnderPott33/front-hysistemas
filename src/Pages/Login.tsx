import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import InputERP from "../components/utils/InputERP";
import logo from '../assets/logo/hytectTest.svg';
import Logo from "../theme/logoRaw";

const API_URL = import.meta.env.VITE_API_URL;




interface LoginError {
    message: string;
    field?: "email" | "password" | "general";
}

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<LoginError | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!email.trim()) {
            errors.email = "El email es requerido";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Email inválido";
        }

        if (!password) {
            errors.password = "La contraseña es requerida";
        } else if (password.length < 6) {
            errors.password = "La contraseña debe tener al menos 6 caracteres";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${API_URL}/api/usuarios/login`,
                {
                    email: email.trim(),
                    password,
                },
                {
                    timeout: 10000,
                }
            );
            /* console.log(response); */

            const { token, user } = response.data;

            if (rememberMe) {
                localStorage.setItem("rememberEmail", email);
            } else {
                localStorage.removeItem("rememberEmail");
            }

            login(token, user);
            navigate("/dashboard");
        } catch (err: any) {
            const status = err?.response?.status;
            let errorMsg = "Error al iniciar sesión. Verificá tus credenciales.";

            if (status === 401) {
                errorMsg = "Email o contraseña incorrectos.";
            } else if (status === 429) {
                errorMsg = "Demasiados intentos. Intenta más tarde.";
            } else if (status === 500) {
                errorMsg = "Error en el servidor. Intenta más tarde.";
            } else if (err.message === "timeout of 10000ms exceeded") {
                errorMsg = "Tiempo de conexión agotado. Verifica tu conexión.";
            } else if (err?.response?.data?.message) {
                errorMsg = err.response.data.message;
            }

            setError({
                message: errorMsg,
                field: "general",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex overflow-hidden bg-mi-primera/10 font-sans text-mi-cuarta">
            {/* Panel izquierdo - Corporativo */}
            <div className="hidden lg:flex relative overflow-hidden w-full min-h-screen bg-mi-gradient">
                <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-white/5" />
                <div className="absolute bottom-[-110px] -left-20 w-80 h-80 rounded-full bg-white/10" />
                <div className="absolute top-[340px] right-[-70px] w-80 h-80 rounded-full bg-white/5" />

                <div className="relative z-10 w-full max-w-[680px] mx-auto px-10 pt-7">


                    <div className="mb-10 mt-10">
                        <h1 className="text-white text-4xl xl:text-5xl font-extrabold leading-tight">
                            ¡Bienvenido de vuelta!
                        </h1>
                        <p className="mt-3 text-white/80 text-lg xl:text-xl leading-relaxed max-w-[600px]">
                            Accede a tu cuenta y continúa gestionando tu negocio de forma sencilla.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-5 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 px-5 py-5">
                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-white/15 flex items-center justify-center">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M4 19V5" />
                                    <path d="M4 19h16" />
                                    <path d="m7 15 4-4 3 3 5-6" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-white text-lg font-bold">Gestión Completa</h3>
                                <p className="text-white/80 text-base leading-snug">
                                    Controla ventas, inventario, finanzas y clientes en un solo lugar.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 px-5 py-5">
                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-white/15 flex items-center justify-center">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="6" y="3" width="12" height="18" rx="2" />
                                    <path d="M11 17h2" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-white text-lg font-bold">Acceso Fácil</h3>
                                <p className="text-white/80 text-base leading-snug">
                                    Usa desde el celular o computadora, en cualquier momento y lugar.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 px-5 py-5">
                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-white/15 flex items-center justify-center">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-white text-lg font-bold">Seguridad Total</h3>
                                <p className="text-white/80 text-base leading-snug">
                                    Tus datos protegidos con la mejor tecnología.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel derecho - Formulario */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 lg:py-0 bg-white">
                <div className="w-full max-w-sm">
                    {/* Logo mobile */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-mi-cuarta shadow-lg shadow-mi-cuarta/30">
                            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-mi-gradient">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M2 4.5C4 3.5 7 3.5 12 6c5-2.5 8-2.5 10-1.5v14c-2-1-5-1-10 1.5-5-2.5-8-2.5-10-1.5v-14Z" />
                                    <path d="M12 6v14" />
                                </svg>
                            </div>
                            <span className="text-white text-base font-extrabold tracking-wide">
                                Owl-Soft <span className="font-light text-mi-primera">ERP</span>
                            </span>
                        </div>
                    </div>

                    {/* Encabezado */}
                    <div className="grid justify-center items-center mb-2">
                        {/* <img
                            src={logo}
                            alt="H&Y TECH"
                            className="w-45 object-contain"
                        /> */}
                        <Logo className="w-50"/>
                    </div>
                    <div className="flex  justify-center items-center gap-3 mb-8">
                        <span><span className="text-mi-segunda font-bold text-3xl">H</span><span className="text-mi-primera font-bold text-3xl">Y</span></span><span className="text-mi-segunda font-bold text-3xl">Sistemas</span>
                    </div>
                    <div className="flex  justify-center items-center">
                        
                    </div>
                    {/* <div className="mb-8">
                        <h1 className="text-4xl font-bold text-mi-tercera mb-2 tracking-tight">
                            Bienvenido
                        </h1>
                        <p className="text-mi-cuarta/60">
                            Ingresá con tu email y contraseña para acceder al sistema.
                        </p>
                    </div> */}

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        {/* Email */}
                        <div className="space-y-2">
                            <InputERP
                                id="email"
                                type="email"
                                label="E-mail"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e);
                                    if (validationErrors.email) {
                                        setValidationErrors((prev) => ({ ...prev, email: "" }));
                                    }
                                }}
                                disabled={loading}
                                autoComplete="email"
                                aria-invalid={!!validationErrors.email}
                                aria-describedby={validationErrors.email ? "email-error" : undefined}
                            />

                            {validationErrors.email && (
                                <p id="email-error" className="text-sm text-red-600">
                                    {validationErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Contraseña */}
                        <div className="space-y-2">

                            <InputERP
                                id="password"
                                type="password"
                                label="Password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e);
                                    if (validationErrors.password) {
                                        setValidationErrors((prev) => ({ ...prev, password: "" }));
                                    }
                                }}
                                disabled={loading}
                                autoComplete="current-password"
                                aria-invalid={!!validationErrors.password}
                                aria-describedby={validationErrors.password ? "password-error" : undefined}
                            />

                            {validationErrors.password && (
                                <p id="password-error" className="text-sm text-red-600">
                                    {validationErrors.password}
                                </p>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div
                                className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm"
                                role="alert"
                            >
                                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{error.message}</span>
                            </div>
                        )}

                        {/* Botón */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 mt-6 rounded-2xl font-semibold text-white bg-mi-gradient shadow-lg shadow-mi-tercera/30 hover:shadow-xl hover:shadow-mi-tercera/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mi-primera focus-visible:ring-offset-2 active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <span>Ingresando...</span>
                                </>
                            ) : (
                                "Ingresar al sistema"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}