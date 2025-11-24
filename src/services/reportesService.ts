import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import type { Reporte, ReporteInput } from '../types';
import { db } from './firebase';

const reportesRef = collection(db, 'reportes');

export function subscribeToReportes(
  onData: (items: Reporte[]) => void,
  onError: (error: Error) => void
) {
  const reportesQuery = query(reportesRef, orderBy('fecha', 'desc'));

  return onSnapshot(
    reportesQuery,
    (snapshot) => {
      const items = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        const fechaNormalizada = parseFecha(data.fecha);
        return {
          id: docSnapshot.id,
          fecha: fechaNormalizada,
          mes: data.mes ?? deriveMes(fechaNormalizada),
          descripcion: data.descripcion ?? '',
          observaciones: data.observaciones ?? '',
          lugarCompra: data.lugarCompra ?? '',
          valor: Number(data.valor ?? 0),
        } satisfies Reporte;
      });

      onData(items);
    },
    (error) => {
      onError(error);
    }
  );
}

export function createReporte(data: ReporteInput) {
  return addDoc(reportesRef, sanitizeData(data));
}

export function updateReporte(id: string, data: ReporteInput) {
  const reporteDoc = doc(db, 'reportes', id);
  return updateDoc(reporteDoc, sanitizeData(data));
}

export function deleteReporte(id: string) {
  const reporteDoc = doc(db, 'reportes', id);
  return deleteDoc(reporteDoc);
}

function sanitizeData(data: ReporteInput) {
  const fechaNormalizada = data.fecha;
  const mes = deriveMes(fechaNormalizada);
  return {
    ...data,
    fecha: fechaNormalizada,
    valor: Number(data.valor) || 0,
    mes,
    updatedAt: Timestamp.now(),
  };
}

function parseFecha(fecha: unknown) {
  if (typeof fecha === 'string') {
    return fecha;
  }

  if (fecha instanceof Timestamp) {
    return fecha.toDate().toISOString().split('T')[0];
  }

  return '';
}

function deriveMes(fecha: string) {
  if (!fecha) return '';
  return fecha.slice(0, 7);
}


