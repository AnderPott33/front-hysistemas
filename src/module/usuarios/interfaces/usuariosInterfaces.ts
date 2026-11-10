export interface InterfaceUsuarios {
    id: number | string;
    nombre: string;
    email: string;
    contrasena?: string;
    grupo_privilegios?: number | string;
    activo?: boolean | number;
    creado_en?: string;
    caja_logueada?: number;
}