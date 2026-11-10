import logoRaw from '../assets/logo/H_Y_tematizado.svg?raw';
import type { CSSProperties } from 'react';

interface LogoProps {
    className?: string;
    color?: string; // ex: '#ffffff' ou '#9942f0'. Se omitido, usa a paleta do tema
}

export default function Logo({ className = '', color }: LogoProps) {
    const lockedStyle = color
        ? ({
              '--logo-cuerpo': color,
              '--color-mi-cuarta': color,
              '--color-mi-segunda': color,
              '--color-mi-tercera': color,
              '--color-mi-primera': color,
          } as CSSProperties)
        : undefined;

    return (
        <div
            role="img"
            aria-label="H&Y TECH"
            style={lockedStyle}
            className={`[&>svg]:w-full [&>svg]:h-auto ${className}`}
            dangerouslySetInnerHTML={{ __html: logoRaw }}
        />
    );
}