import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  BookOpen,
  ChevronDown,
  Home,
  Settings,
  LogOut,
  UserCircle,
  FileText,
  FolderOpen,
  Warehouse,
  User,
  Network,
  BriefcaseBusiness,
  Landmark,
  CornerRightUp,
  CornerRightDown,
  Package,
  ShoppingCart,
  DollarSign,
  Wallet,
  UserPen,
  CircleDollarSign,
  Sun,
  Moon,
  ChartBarStacked,
  Scale,
  HandCoins,
  CornerUpLeft,
  CornerUpRight,
  Tags,
  BookText,
  Users,
} from 'lucide-react';
import { useCaja } from '../../context/CajaContext';
import { usePermisos } from '../../context/PermisosContext';
import logo from '../../assets/logo/hytectTest.svg';
import Logo from '../../theme/logoRaw';
import { useDarkMode } from '../../theme/darkMode';
import ModalLoguearCaja from '../../module/cajas/components/modalLoguearCaja';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

interface TopbarProps {
  setIsMobileOpen: (isOpen: boolean) => void;
  isDark: boolean;
  onToggleDark: () => void;
}

interface MenuSubItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  permiso?: string;
  subtitle?: string;
}

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  permiso?: string;
  subtitle?: string;
  subItems?: MenuSubItem[];
}

interface UserMenuItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  permiso?: string; // si no se define, el enlace es visible para cualquier usuario autenticado
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    icon: <Home className="w-5 h-5" />,
    path: '/dashboard',
    permiso: 'ver_dashboard',
  },
    {
    name: 'Archivo',
    icon: <BookText className="w-5 h-5" />,
    subtitle: 'Gestión de datos del sistema',
    subItems: [
      { name: 'Persona', icon: <Users className="w-4 h-4" />, path: '/archivo/persona', permiso: 'ver_pedidos' },
    ],
  },
  /* {
    name: 'Inventario',
    icon: <Package className="w-5 h-5" />,
    subtitle: 'Control de Stock',
    subItems: [
      { name: 'Artículos', icon: <Package className="w-4 h-4" />, path: '/inventario/productos', permiso: 'ver_productos' },
      { name: 'Categorías', icon: <FolderOpen className="w-4 h-4" />, path: '/inventario/categorias', permiso: 'ver_categorias', subtitle: 'REGISTROS' },
      { name: 'Subcategorías', icon: <FolderOpen className="w-4 h-4" />, path: '/inventario/subcategorias', permiso: 'ver_categorias', subtitle: 'REGISTROS' },
      { name: 'Marca', icon: <FolderOpen className="w-4 h-4" />, path: '/inventario/marcas', permiso: 'ver_categorias', subtitle: 'REGISTROS' },
      { name: 'Unidades de Artículo', icon: <FolderOpen className="w-4 h-4" />, path: '/inventario/unidades', permiso: 'ver_categorias', subtitle: 'REGISTROS' },
      { name: 'Agregar Compra', icon: <Warehouse className="w-4 h-4" />, path: '/inventario/compras', permiso: 'ver_almacenes', subtitle: 'COMPRAS' },
    ],
  }, */
/*   {
    name: 'Ventas',
    icon: <ShoppingCart className="w-5 h-5" />,
    subtitle: 'Gestión de Ventas',
    subItems: [
      { name: 'Pedidos', icon: <ShoppingCart className="w-4 h-4" />, path: '/ventas/pedidos', permiso: 'ver_pedidos' },
      { name: 'Venta', icon: <BriefcaseBusiness className="w-4 h-4" />, path: '/ventas/ventas', permiso: 'pagina_ventas' },
    ],
  }, */
  {
    name: 'Finanzas',
    icon: <DollarSign className="w-5 h-5" />,
    subtitle: 'Gestión Financiera',
    subItems: [
      { name: 'Extracto Cuenta', icon: <BriefcaseBusiness className="w-4 h-4" />, path: '/finanzas/extracto-cuenta', permiso: 'pagina_cajas' },
      { name: 'Cajas', icon: <BriefcaseBusiness className="w-4 h-4" />, path: '/finanzas/cajas', permiso: 'pagina_cajas' },
      { name: 'Recibir Valores', icon: <CornerUpLeft className="w-4 h-4" />, path: '/finanzas/recibimiento', permiso: 'pagina_recibimiento' },
      { name: 'Pagar Valores', icon: <CornerUpRight className="w-4 h-4" />, path: '/finanzas/pago', permiso: 'pagina_pago' },
      { name: 'Monedas y Cotizaciones', icon: <CircleDollarSign className="w-4 h-4" />, path: '/finanzas/monedas', permiso: 'pagina_monedas' },
    ],
  },
  {
    name: 'Contable',
    icon: <Scale className="w-5 h-5" />,
    subtitle: 'Gestión Contable',
    subItems: [
      { name: 'Cuentas', icon: <Wallet className="w-4 h-4" />, path: '/contable/plan_cuentas', permiso: 'pagina_cuentas' },
      { name: 'Categorias', icon: <Tags className="w-4 h-4" />, path: '/contable/categoria', permiso: 'pagina_cuentas' },
    ],
  },
  {
    name: 'Configuraciones',
    icon: <Settings className="w-5 h-5" />,
    subtitle: 'Ajustes Generales',
    subItems: [
      { name: 'Empresa', icon: <Landmark className="w-4 h-4" />, path: '/configuraciones/empresa', permiso: 'pagina_empresa', subtitle: 'EMPRESA' },
      { name: 'Usuarios', icon: <User className="w-4 h-4" />, path: '/configuraciones/usuarios', permiso: 'pagina_usuarios', subtitle: 'ACCESO' },
      { name: 'Privilegios', icon: <Network className="w-4 h-4" />, path: '/configuraciones/privilegios', permiso: 'pagina_privilegios', subtitle: 'ACCESO' },
      { name: 'Operaciones', icon: <Network className="w-4 h-4" />, path: '/configuraciones/operaciones', permiso: 'pagina_operaciones', subtitle: 'CONTABLE' },
    ],
  },
];

const userMenuItems: UserMenuItem[] = [
  {
    name: 'Mi Perfil',
    icon: <UserPen className="w-4 h-4 text-mi-cuarta/40" />,
    path: '/perfil',
    permiso: 'pagina_perfil',
  },
  {
    name: 'Ajustes',
    icon: <Settings className="w-4 h-4 text-mi-cuarta/40" />,
    path: '/configuracion/cuenta',
    permiso: 'pagina_cuenta',
  },
];

const groupSubItemsBySubtitle = (items: MenuSubItem[]) => {
  const grouped: { subtitle?: string; items: MenuSubItem[] }[] = [];
  const subtitleMap = new Map<string, MenuSubItem[]>();

  items.forEach((item) => {
    const key = item.subtitle || '';
    if (!subtitleMap.has(key)) subtitleMap.set(key, []);
    subtitleMap.get(key)!.push(item);
  });

  subtitleMap.forEach((items, subtitle) => {
    grouped.push({ subtitle: subtitle || undefined, items });
  });

  return grouped;
};

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const popoverRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const { tienePermiso } = usePermisos();
  const puedeCambiarTema = tienePermiso("perfil_altera_tema_del_sistema");
  const menuItemsFiltrados = React.useMemo(() => {
    return menuItems.reduce<MenuItem[]>((acc, item) => {
      if (item.subItems) {
        const subItemsPermitidos = item.subItems.filter(
          (sub) => !sub.permiso || tienePermiso(sub.permiso)
        );
        if (subItemsPermitidos.length > 0) {
          acc.push({ ...item, subItems: subItemsPermitidos });
        }
        return acc;
      }

      if (!item.permiso || tienePermiso(item.permiso)) {
        acc.push(item);
      }
      return acc;
    }, []);
  }, [tienePermiso]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item: MenuItem) => {
    if (item.subItems) {
      setActivePopover(activePopover === item.name ? null : item.name);
    } else {
      setActivePopover(null);
      setIsMobileOpen(false);
    }
  };

  const isItemActive = (item: MenuItem): boolean => {
    if (item.path) return location.pathname.startsWith(item.path);
    if (item.subItems) return item.subItems.some((s) => location.pathname.startsWith(s.path));
    return false;
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-mi-cuarta/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        ref={popoverRef}
        className={`fixed top-20 left-3 bottom-3 w-16 rounded-3xl bg-white/95 backdrop-blur-md border border-mi-primera/15 shadow-xl shadow-mi-cuarta/10 flex flex-col items-center py-3 z-50 transition-transform duration-300 ease-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-[150%] lg:translate-x-0'}
        `}
      >
        <nav className="w-full flex-1 space-y-2 flex flex-col items-center relative">
          {menuItemsFiltrados.map((item) => {
            const hasSub = !!item.subItems;
            const isPopOpen = activePopover === item.name;
            const active = isItemActive(item);

            const buttonClasses = `p-2.5 rounded-2xl transition-all duration-200 group relative
              ${active && !isPopOpen
                ? 'bg-mi-gradient text-white shadow-lg shadow-mi-tercera/30'
                : 'text-mi-cuarta/60 hover:bg-mi-primera/10 hover:text-mi-tercera'}
              ${isPopOpen ? 'bg-mi-primera/15 text-mi-tercera' : ''}
            `;

            return (
              <div key={item.name} className="relative w-full flex justify-center">
                {hasSub ? (
                  <button onClick={() => handleItemClick(item)} className={buttonClasses} title={item.name}>
                    {item.icon}
                  </button>
                ) : (
                  <Link to={item.path!} onClick={() => handleItemClick(item)} className={buttonClasses} title={item.name}>
                    {item.icon}
                  </Link>
                )}

                {hasSub && isPopOpen && (
                  <div className="absolute left-full ml-3 top-0 w-60 bg-white rounded-2xl border border-mi-primera/15 shadow-2xl shadow-mi-cuarta/20 overflow-hidden z-[1500]">
                    <div className="px-4 py-3 bg-mi-gradient text-white flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold tracking-wide truncate">{item.name}</span>
                        {item.subtitle && (
                          <span className="text-xs text-white/70 truncate">{item.subtitle}</span>
                        )}
                      </div>
                    </div>

                    <div className="py-2 max-h-96 overflow-y-auto">
                      {groupSubItemsBySubtitle(item.subItems!).map((group, groupIdx) => (
                        <div key={groupIdx} className="mb-1">
                          {group.subtitle && (
                            <div className="flex items-center gap-2 px-4 py-2">
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mi-tercera/40 to-transparent" />
                              <span className="text-[10px] font-bold tracking-widest text-mi-tercera uppercase">
                                {group.subtitle}
                              </span>
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-mi-tercera/40 to-transparent" />
                            </div>
                          )}

                          {group.items.map((sub) => {
                            const subActive = location.pathname.startsWith(sub.path);
                            return (
                              <Link
                                key={sub.name}
                                to={sub.path}
                                onClick={() => {
                                  setActivePopover(null);
                                  setIsMobileOpen(false);
                                }}
                                className={`flex items-center gap-3 mx-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 group
                                  ${subActive
                                    ? 'bg-mi-gradient text-white font-semibold shadow-md shadow-mi-tercera/25'
                                    : 'text-mi-cuarta/70 hover:bg-mi-primera/10 hover:text-mi-tercera'}`}
                              >
                                <span
                                  className={`flex-shrink-0 transition-colors ${subActive ? 'text-white' : 'text-mi-cuarta/40 group-hover:text-mi-tercera'
                                    }`}
                                >
                                  {sub.icon}
                                </span>
                                <span className="truncate">{sub.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

const Topbar: React.FC<TopbarProps> = ({ setIsMobileOpen, isDark, onToggleDark }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { caja, seleccionarCaja } = useCaja();
  const { user, logout } = useAuth();

  const cajaRegistrada = caja?.id;
  const [modalCajaOpen, setModalCajaOpen] = useState(false)

  const { tienePermiso } = usePermisos();
  const puedeCambiarTema = tienePermiso("perfil_altera_tema_del_sistema");

  const userMenuFiltrados = React.useMemo(
    () => userMenuItems.filter((item) => !item.permiso || tienePermiso(item.permiso)),
    [tienePermiso]
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const initial = user?.nombre?.trim()?.charAt(0)?.toUpperCase() || '?';

  return (
    <header
      className={`fixed top-0 left-0 right-0 h-16 bg-mi-cuarta shadow-lg shadow-mi-cuarta/30 z-50 flex items-center justify-between px-3 lg:px-4 ${isDark ? 'border-b border-white/10' : ''
        }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-white/80 rounded-xl hover:bg-white/10 transition-colors lg:hidden focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <div className='flex  justify-center items-center'>
              {/* <img
                src={logo}
                alt="H&Y TECH"
                className="w-16 object-contain"
              /> */}
              {/* <Logo className="w-16"/> */}
              <span className='text-white font-semibold  text-lg'>HY Sistemas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Caja logueada */}
        {/* Caja logueada: al hacer clic abre el modal para cambiarla */}
        <button
          type="button"
          onClick={() => setModalCajaOpen(true)
          }
          title="Cambiar caja logueada"
          className="hidden sm:flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition-colors focus:outline-none"
        >
          <Wallet className="w-4 h-4 text-mi-primera" />
          <span className="text-[11px] text-white/60 font-medium">Caja:</span>
          <span className="text-xs font-bold text-white">{cajaRegistrada ?? '—'}</span>
        </button>

        {/* Toggle modo oscuro */}
        {puedeCambiarTema ? <button
          type="button"
          onClick={onToggleDark}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
          disabled={!puedeCambiarTema}
          aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button> : ''}

        {/* Usuario */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 py-1 pl-1 pr-2 rounded-xl hover:bg-white/10 transition-colors focus:outline-none"
          >
            <div className="h-9 w-9 rounded-full bg-mi-gradient text-white flex items-center justify-center font-semibold text-xs shadow-md border border-white/20">
              {initial}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight uppercase">{user?.nombre ?? 'Usuario'}</span>
              <span className="text-[11px] text-white/60 leading-tight">{user?.rol?.nombre ?? 'Sin rol'}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 hidden md:block ${isUserMenuOpen ? 'rotate-180' : ''
                }`}
            />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-mi-primera/15 shadow-2xl shadow-mi-cuarta/25 p-1.5 z-50 transition-all duration-200">
              <div className="px-3 py-2.5 mb-1 rounded-xl bg-mi-primera/10 md:hidden">
                <p className="text-xs font-bold text-mi-cuarta">{user?.nombre ?? 'Usuario'}</p>
                <p className="text-[11px] text-mi-cuarta/60">{user?.email ?? ''}</p>
                <p className="text-[11px] text-mi-tercera mt-0.5">Caja: {cajaRegistrada}</p>
              </div>

              {userMenuFiltrados.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-mi-cuarta/80 hover:bg-mi-primera/10 hover:text-mi-tercera transition-colors"
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}

              <div className="border-t border-mi-primera/10 mt-1 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ModalLoguearCaja
        isOpen={modalCajaOpen}
        onClose={() => setModalCajaOpen(false)}
        cajaActualId={Number(cajaRegistrada)}
      />
    </header>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isDark, toggle } = useDarkMode();

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans ${isDark ? 'text-slate-100' : 'bg-mi-primera/10 text-mi-cuarta'
        }`}
    >
      <Topbar setIsMobileOpen={setIsMobileOpen} isDark={isDark} onToggleDark={toggle} />
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      <div className="flex-1 flex flex-col mt-16 min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-3 pb-3 pt-4 lg:pl-21 lg:pr-2">
          <div className="max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}