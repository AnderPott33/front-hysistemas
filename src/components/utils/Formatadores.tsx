/**
 * Formata uma data para o padrão brasileiro: DD/MM/YYYY HH:mm:ss
 * @param date Data em formato Date, string ou number
 * @returns string formatada ou vazia
 */
export const formatarDataHora = (
  date: Date | string | number | null | undefined
): string => {
  if (!date || date === "") return "";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "";

  const partes = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).formatToParts(d);

  const mapa = Object.fromEntries(
    partes.map((p) => [p.type, p.value])
  );

  return `${mapa.day}/${mapa.month}/${mapa.year}, ${mapa.hour}:${mapa.minute}`;
};

/**
 * Formata uma data para o padrão brasileiro sem hora: DD/MM/YYYY
 * @param date Data em formato Date, string ou number
 * @returns string formatada ou vazia
 */
export const formatarData = (
  date: Date | string | number | null | undefined
): string => {
  if (!date || date === "") return "";

  let d: Date;

  if (typeof date === 'string') {
    const [ano, mes, dia] = date.split('T')[0].split('-');
    d = new Date(Number(ano), Number(mes) - 1, Number(dia));
  } else {
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return "";

  const partes = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(d);

  const mapa = Object.fromEntries(
    partes.map((p) => [p.type, p.value])
  );

  return `${mapa.day}/${mapa.month}/${mapa.year}`;
};

/**
 * Formata uma data para input HTML (YYYY-MM-DD ou YYYY-MM-DDTHH:mm)
 * @param date Data em formato Date, string ou number
 * @param incluirHora Se verdadeiro, retorna formato para input 'datetime-local'
 * @returns string formatada para value do input
 */
export const formatarDataInput = (
  date: Date | string | number | null | undefined,
  incluirHora: boolean = true
): string => {
  if (!date || date === "") return "";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "";

  const partes = new Intl.DateTimeFormat("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(incluirHora && {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
    timeZone: "America/Asuncion",
  }).formatToParts(d);

  const mapa = Object.fromEntries(
    partes.map((p) => [p.type, p.value])
  );

  if (incluirHora) {
    return `${mapa.year}-${mapa.month}-${mapa.day}T${mapa.hour}:${mapa.minute}`;
  }

  return `${mapa.year}-${mapa.month}-${mapa.day}`;
};

/**
 * Converte para ISO local (YYYY-MM-DDTHH:mm:ss)
 * mantendo a data e hora correta da timezone
 * @param fecha Data em formato Date, string ou null
 * @returns string formatada no padrão ISO ou null
 */
export const formatearFechaLocal = (
  fecha: string | Date | null | undefined
): string | null => {
  if (!fecha) return null;

  const date = new Date(fecha);

  if (isNaN(date.getTime())) {
    console.error("formatearFechaLocal: Data inválida", fecha);
    return null;
  }

  const partes = new Intl.DateTimeFormat("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Asuncion",
  }).formatToParts(date);

  const mapa = Object.fromEntries(
    partes.map((p) => [p.type, p.value])
  );

  return `${mapa.year}-${mapa.month}-${mapa.day}T${mapa.hour}:${mapa.minute}:${mapa.second}`;
};

/**
 * Objeto de moneda desde el backend (FLEXIBLE)
 */
interface Moneda {
  id: number | string;
  codigo: string;
  nombre: string;
  simbolo: string;
  decimales: number;
  activo?: boolean;
  creado_en?: string;
  [key: string]: any;
}

/**
 * Formata un valor numérico para diferentes moedas
 * Recibe un objeto de moneda con estructura del backend
 * @param valor Número o string numérica a formatear
 * @param moneda Objeto de moneda con código, símbolo y decimales (o string con código)
 * @returns string formateada con símbolo y decimales correctos
 */
export const formatarMoeda = (
  valor: number | string | null | undefined,
  moneda: Moneda | Partial<Moneda> | string | undefined = "PYG"
): string => {
  // Validación del valor
  if (valor === null || valor === undefined || valor === "") return "";

  const n = typeof valor === "string" ? parseFloat(valor) : valor;
  if (isNaN(n)) return "";

  // Valores por defecto
  let simbolo = "₲";
  let decimales = 0;
  let locale = "pt-BR";

  // Si es un objeto de moneda del backend
  if (typeof moneda === "object" && moneda !== null) {
    simbolo = (moneda as Moneda).simbolo || "₲";
    decimales = typeof (moneda as Moneda).decimales === "number" ? (moneda as Moneda).decimales : 0;
  } 
  // Si es un string con código de moneda
  else if (typeof moneda === "string") {
    switch (moneda.toUpperCase()) {
      case "BRL":
        simbolo = "R$";
        decimales = 2;
        break;
      case "USD":
        simbolo = "$";
        decimales = 2;
        break;
      case "PYG":
      default:
        simbolo = "₲";
        decimales = 0;
    }
  }

  try {
    const numeroFormateado = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }).format(n);

    return `${simbolo} ${numeroFormateado}`;
  } catch (error) {
    console.warn(`Error formateando moneda:`, error);
    return `${simbolo} ${n}`;
  }
};

/**
 * Formata um valor numérico para percentual
 * @param valor Número ou string numérica
 * @param decimais Número de casas decimais (padrão: 2)
 * @returns string formatada com %
 */
export const formatarPercentual = (
  valor: number | string | null | undefined,
  decimais: number = 2
): string => {
  if (valor === null || valor === undefined || valor === "") return "";

  const n = typeof valor === "string" ? parseFloat(valor) : valor;

  if (isNaN(n)) return "";

  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }).format(n / 100);
};

/**
 * Formata um número com separadores de milhar
 * @param valor Número ou string numérica
 * @param decimais Número de casas decimais (padrão: 2)
 * @returns string formatada
 */
export const formatarNumero = (
  valor: number | string | null | undefined,
  decimais: number = 2
): string => {
  if (valor === null || valor === undefined || valor === "") return "";

  const n = typeof valor === "string" ? parseFloat(valor) : valor;

  if (isNaN(n)) return "";

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }).format(n);
};

/**
 * Formata hora no padrão HH:mm:ss
 * @param date Data ou string com hora
 * @returns string formatada ou vazia
 */
export const formatarHora = (
  date: Date | string | null | undefined
): string => {
  if (!date || date === "") return "";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "";

  const partes = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Asuncion",
  }).formatToParts(d);

  const mapa = Object.fromEntries(
    partes.map((p) => [p.type, p.value])
  );

  return `${mapa.hour}:${mapa.minute}:${mapa.second}`;
};

/**
 * Formata hora sem segundos: HH:mm
 * @param date Data ou string com hora
 * @returns string formatada ou vazia
 */
export const formatarHoraSimples = (
  date: Date | string | null | undefined
): string => {
  if (!date || date === "") return "";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "";

  const partes = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Asuncion",
  }).formatToParts(d);

  const mapa = Object.fromEntries(
    partes.map((p) => [p.type, p.value])
  );

  return `${mapa.hour}:${mapa.minute}`;
};