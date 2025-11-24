export type Reporte = {
  id: string;
  fecha: string;
  descripcion: string;
  observaciones: string;
  lugarCompra: string;
  valor: number;
  mes: string;
};

export type ReporteInput = Omit<Reporte, 'id' | 'mes'>;


