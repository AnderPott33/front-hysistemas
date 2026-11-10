export interface InterfaceGrupoPrivilegios {
    id: number | string;
    nombre: string;
    privilegios: IPrivilegio[];
    creado_en?: string;
}

export interface IPrivilegio {
    modulo: string;
    acciones: IAccion[];
}

export interface IAccion {
    nombre: string;
    clave: string;
    marcada: boolean;
    label: string;
}

export interface PrivilegiosDisponibles {
    [modulo: string]: {
        label: string;
        acciones: {
            clave: string;
            label: string;
        }[];
    };
}
