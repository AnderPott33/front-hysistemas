import React, { createContext, useContext, type ReactNode, type CSSProperties } from 'react';

// Importar banderas SVG
import PyFlag from '../assets/flags/py.svg';
import BrFlag from '../assets/flags/br.svg';
import ArsFlag from '../assets/flags/ars.svg';
import UsFlag from '../assets/flags/us.svg';
import EuFlag from '../assets/flags/eu.svg';

// Tipos
interface FlagContextType {
  flags: Record<string, string>;
  countryNames: Record<string, string>;
}

// Definir datos
const flagsData = {
  PYG: PyFlag,
  BRL: BrFlag,
  ARS: ArsFlag,
  USD: UsFlag,
  EUR: EuFlag,
};

const countryNamesData = {
  PYG: 'Paraguay',
  BRL: 'Brasil',
  ARS: 'Argentina',
  USD: 'Estados Unidos',
  EUR: 'Europa',
};

// Crear el contexto
const FlagContext = createContext<FlagContextType>({
  flags: flagsData,
  countryNames: countryNamesData,
});

interface FlagProviderProps {
  children: ReactNode;
}

const defaultContextValue: FlagContextType = {
  flags: flagsData,
  countryNames: countryNamesData,
};

export const FlagProvider = ({ children }: FlagProviderProps): React.ReactElement => {
  return (
    <FlagContext.Provider value={defaultContextValue}>
      {children}
    </FlagContext.Provider>
  );
};

export const useFlags = (): FlagContextType => {
  const context = useContext(FlagContext);
  if (!context) {
    throw new Error('useFlags debe ser usado dentro de FlagProvider');
  }
  return context;
};

// Tipos mejorados para Flag
interface FlagProps {
  country: 'PYG' | 'BRL' | 'ARS' | 'USD';
  size?: number;
  className?: string; // Para Tailwind u otras clases
  style?: CSSProperties; // Para estilos inline
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'full'; // Estilos de esquinas
}

// Componente mejorado
export const Flag = ({ 
  country, 
  size = 32, 
  className = '',
  style = {},
  rounded = false
}: FlagProps) => {
  const { flags, countryNames } = useFlags();
  
  if (!flags[country]) {
    console.warn(`Bandera no encontrada: ${country}`);
    return null;
  }

  // Mapear valores de rounded a borderRadius
  const roundedMap: Record<string, string> = {
    'true': '0.5rem',      // rounded
    'sm': '0.25rem',       // rounded-sm
    'md': '0.375rem',      // rounded-md
    'lg': '0.75rem',       // rounded-lg
    'full': '9999px',      // rounded-full (circular)
  };

  const borderRadius = rounded 
    ? roundedMap[String(rounded)] || roundedMap['true'] 
    : undefined;

  const combinedStyle: CSSProperties = {
    objectFit: 'cover',
    borderRadius,
    ...style,
  };

  return (
    <img
      src={flags[country]}
      alt={countryNames[country]}
      width={size}
      height={size}
      className={className}
      style={combinedStyle}
    />
  );
};

export default FlagContext;