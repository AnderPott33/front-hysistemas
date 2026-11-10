import { ShieldOff } from 'lucide-react'
const ErrorPage = () => {
    return (
        <>
            <div className="w-full h-150 flex justify-center items-center">
                <div className="p-20 max-w-3xl flex flex-col justify-center items-center gap-4 rounded-lg  bg-red-600/15 border border-red-600 text-red-600 text-xl">
                    <div className="rounded-full bg-red-100 p-4 ">
                        <ShieldOff size={80} className="text-red-600" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl text-center font-bold text-red-700">
                            Acceso Denegado
                        </h1>
                        <p className="max-w-md text-lg text-center text-red-600 ">
                            No tienes autorización para acceder a este recurso.
                            Por favor, contacta al administrador para solicitar permisos.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ErrorPage;