import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { type InterfaceCajas } from '../module/cajas/Interfaces/InterfaceCajas';

interface CajaContextType {
  caja: InterfaceCajas | null;
  loading: boolean;
  seleccionarCaja: (cajaId: number | string | null) => Promise<void>;
  obtenerCaja: () => Promise<void>;
  recargarCaja: () => Promise<void>;
}

const CajaContext = createContext<CajaContextType | undefined>(undefined);

export const CajaProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [caja, setCaja] = useState<InterfaceCajas | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const hasInitializedRef = useRef(false); // ← AQUÍ

  const API = import.meta.env.VITE_API_URL;

  const obtenerCaja = async () => {
    if (!isAuthenticated || !token || !user?.id) return;

    setLoading(true);
    try {
      const res = await axios.get<InterfaceCajas>(`${API}/api/cajas/activa`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCaja(res.data || null);
    } catch (error) {
      console.error("Error obteniendo caja activa:", error);
      setCaja(null);
    } finally {
      setLoading(false);
    }
  };

  const recargarCaja = async () => {
    setLoading(true);
    try {
      const res = await axios.get<InterfaceCajas>(`${API}/api/cajas/activa`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCaja(res.data || null);
    } catch (error) {
      console.error("Error recargando caja activa:", error);
      setCaja(null);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarCaja = async (cajaId: number | string | null) => {
    if (!token) return;
    
    setLoading(true);
    try {
      await axios.post(
        `${API}/api/cajas/loguear`,
        { cajaId: cajaId || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!cajaId) {
        setCaja(null);
      } else {
        await obtenerCaja();
      }
    } catch (error) {
      console.error("Error al seleccionar/desloguear caja:", error);
      setCaja(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Solo ejecuta una vez al autenticarse (NO cada vez que vuelves a la app)
    if (isAuthenticated && token && user?.id && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      obtenerCaja();
    } else if (!isAuthenticated) {
      hasInitializedRef.current = false;
      setCaja(null);
      setLoading(false);
    }
  }, [isAuthenticated]); // ← Cambio: solo depende de isAuthenticated

  return (
    <CajaContext.Provider value={{ caja, loading, seleccionarCaja, obtenerCaja, recargarCaja }}>
      {children}
    </CajaContext.Provider>
  );
};

export const useCaja = () => {
  const context = useContext(CajaContext);
  if (!context) throw new Error("useCaja debe usarse dentro de CajaProvider");
  return context;
};