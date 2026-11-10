import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

/* Import de Contexts */
import { AuthProvider, useAuth } from './context/AuthContext';
import { CajaProvider } from './context/CajaContext';
import { PermisosProvider } from './context/PermisosContext';
import { FlagProvider } from './context/FlagsContext';
import { CotizacionProvider, useCotizacion } from './context/CotizacionContext';

import AppLayout from './components/layout/AppLayout';

/* Import de páginas */
import Login from './Pages/Login';
import UsuariosPage from './module/usuarios/views/usuariosPage';
import Dashboard from './Pages/Dashboard';
import CajasPage from './module/cajas/views/CajasPage';
import GrupoPrivilegiosPage from './module/grupoPrivilegios/views/grupoPrivilegiosPage';
import EmpresaPage from './module/empresa/views/empresaPage';
import OperacionesPage from './module/operaciones/views/operacionesPage';
import PerfilPage from './module/perfil/views/perfilPage';
import MonedasPage from './module/moneda/views/monedasPage';
import CuentasPage from './module/cuentas/views/cuentasPage';
import RecibimientoPage from './module/recibimiento/views/recibimientoPage';
import CategoriasPage from './module/categorias/views/categoriasPage';
import ExtractoCuenta from './module/extractoCuenta/views/extractoCuentaPage';
import PagoPage from './module/pago/views/pagoPage';
import PersonasPage from './module/persona/views/personaPage';

const RUTA_MONEDAS = '/finanzas/monedas';

/* Guard: redirige a monedas si no hay cotización para hoy */
function RequiereCotizacion({ children }: { children: React.ReactNode }) {
  const { estado } = useCotizacion();
  const location = useLocation();

  if (estado === 'verificando') return null;

  if (estado === 'sin_cotizacion' && location.pathname !== RUTA_MONEDAS) {
    return <Navigate to={RUTA_MONEDAS} replace />;
  }

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <AppLayout>
      <RequiereCotizacion>{children}</RequiereCotizacion>
    </AppLayout>
  );
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      {/* Pagina de Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* Archivos */}
      <Route path="/archivo/persona" element={
        <ProtectedRoute>
          <PersonasPage />
        </ProtectedRoute>
      } />
      {/* Configuraciones */}
      <Route path="/configuraciones/empresa" element={
        <ProtectedRoute>
          <EmpresaPage />
        </ProtectedRoute>
      } />
      <Route path="/configuraciones/usuarios" element={
        <ProtectedRoute>
          <UsuariosPage />
        </ProtectedRoute>
      } />
      <Route path="/configuraciones/privilegios" element={
        <ProtectedRoute>
          <GrupoPrivilegiosPage />
        </ProtectedRoute>
      } />
      <Route path="/configuraciones/operaciones" element={
        <ProtectedRoute>
          <OperacionesPage />
        </ProtectedRoute>
      } />

      <Route path="/perfil" element={
        <ProtectedRoute>
          <PerfilPage />
        </ProtectedRoute>
      } />

      {/* Finanzas */}
      <Route path="/finanzas/extracto-cuenta" element={
        <ProtectedRoute>
          <ExtractoCuenta />
        </ProtectedRoute>
      } />
      <Route path="/finanzas/cajas" element={
        <ProtectedRoute>
          <CajasPage />
        </ProtectedRoute>
      } />
      <Route path="/finanzas/recibimiento" element={
        <ProtectedRoute>
          <RecibimientoPage />
        </ProtectedRoute>
      } />
      <Route path="/finanzas/pago" element={
        <ProtectedRoute>
          <PagoPage />
        </ProtectedRoute>
      } />
      <Route path="/finanzas/monedas" element={
        <ProtectedRoute>
          <MonedasPage />
        </ProtectedRoute>
      } />
      <Route path="/contable/plan_cuentas" element={
        <ProtectedRoute>
          <CuentasPage />
        </ProtectedRoute>
      } />
      <Route path="/contable/categoria" element={
        <ProtectedRoute>
          <CategoriasPage />
        </ProtectedRoute>
      } />



      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CotizacionProvider>
          <PermisosProvider>
            <CajaProvider>
              <FlagProvider>
                <AppRoutes />
              </FlagProvider>
            </CajaProvider>
          </PermisosProvider>
        </CotizacionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;