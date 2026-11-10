import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

type EstadoCotizacion = 'verificando' | 'ok' | 'sin_cotizacion';

interface CotizacionContextType {
  estado: EstadoCotizacion;
  refrescar: () => Promise<void>;
}

const CotizacionContext = createContext<CotizacionContextType | undefined>(undefined);
const API = import.meta.env.VITE_API_URL;
const ZONA_BRASILIA = 'America/Sao_Paulo';
const MAX_INTENTOS = 3;
const INTERVALO_CAMBIO_DIA_MS = 60_000;

// Fecha actual en Brasilia en formato YYYY-MM-DD (en-CA devuelve ese formato)
function fechaBrasilia(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_BRASILIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function CotizacionProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [estado, setEstado] = useState<EstadoCotizacion>('verificando');

  const intentosRef = useRef(0);
  const reqIdRef = useRef(0);                 // solo la respuesta más reciente cuenta
  const fechaRef = useRef<string>(fechaBrasilia());
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const limpiarReintentos = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const verificar = useCallback(async () => {
    if (!token) return;

    const reqId = ++reqIdRef.current;
    const fecha = fechaBrasilia();
    fechaRef.current = fecha;

    try {
      const { data } = await axios.get(`${API}/api/moneda/cambioHoy`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { fecha },                    // el backend debe usar esta fecha
      });

      if (reqId !== reqIdRef.current) return; // respuesta vieja, descartar

      setEstado(data.hay_tipo_cambio_hoy ? 'ok' : 'sin_cotizacion');
      intentosRef.current = 0;
      console.log(`✅ Cotización (${fecha}, Brasilia):`, data.hay_tipo_cambio_hoy);
    } catch (error) {
      if (reqId !== reqIdRef.current) return;
      console.error('❌ [CotizacionProvider] Error:', error);

      if (intentosRef.current < MAX_INTENTOS) {
        intentosRef.current++;
        const delay = 2 ** intentosRef.current * 1000;
        const t = setTimeout(() => verificar(), delay);
        timeoutsRef.current.push(t);
      } else {
        setEstado('sin_cotizacion');
      }
    }
  }, [token]);

  const refrescar = useCallback(async () => {
    limpiarReintentos();
    intentosRef.current = 0;
    setEstado('verificando');
    await verificar();
  }, [verificar, limpiarReintentos]);

  // Verificación inicial y al cambiar el token
  useEffect(() => {
    if (token) verificar();
    return () => limpiarReintentos();
  }, [token, verificar, limpiarReintentos]);

  // Si cambia el día en Brasilia mientras la app está abierta, volver a verificar
  useEffect(() => {
    const id = setInterval(() => {
      if (fechaBrasilia() !== fechaRef.current) {
        refrescar();
      }
    }, INTERVALO_CAMBIO_DIA_MS);
    return () => clearInterval(id);
  }, [refrescar]);

  return (
    <CotizacionContext.Provider value={{ estado, refrescar }}>
      {children}
    </CotizacionContext.Provider>
  );
}

export function useCotizacion() {
  const context = useContext(CotizacionContext);
  if (!context) {
    throw new Error('useCotizacion debe estar dentro de CotizacionProvider');
  }
  return context;
}