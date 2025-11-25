import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import type { Reporte, ReporteInput } from '../types';
import ReportesTable from '../components/ReportesTable';
import ReporteForm from '../components/ReporteForm';
import {
  createReporte,
  deleteReporte as deleteReporteFromDb,
  subscribeToReportes,
  updateReporte as updateReporteInDb,
} from '../services/reportesService';

export default function ReportesPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ReporteInput>({
    fecha: '',
    descripcion: '',
    observaciones: '',
    lugarCompra: '',
    valor: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );

  const handleAdd = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData({
      fecha: today,
      descripcion: '',
      observaciones: '',
      lugarCompra: '',
      valor: '' as any,
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (reporte: Reporte) => {
    setFormData({
      fecha: reporte.fecha,
      descripcion: reporte.descripcion,
      observaciones: reporte.observaciones,
      lugarCompra: reporte.lugarCompra,
      valor: reporte.valor,
    });
    setEditingId(reporte.id);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const unsubscribe = subscribeToReportes(
      (items) => setReportes(items),
      (error) => {
        console.error('Error al cargar los reportes', error);
        alert('No se pudieron cargar los reportes. Verifica tu configuración de Firebase.');
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este reporte?')) {
      return;
    }

    try {
      await deleteReporteFromDb(id);
    } catch (error) {
      console.error('Error al eliminar reporte', error);
      alert('Ocurrió un error al eliminar el reporte. Intenta nuevamente.');
    }
  };

  const handleSave = async () => {
    if (!formData.fecha || !formData.descripcion || !formData.lugarCompra) {
      alert('Por favor completa los campos obligatorios: Fecha, Descripción y Lugar de Compra');
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        await updateReporteInDb(editingId, formData);
      } else {
        await createReporte(formData);
      }

      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
    } catch (error) {
      console.error('Error al guardar el reporte', error);
      alert('No se pudo guardar el reporte. Revisa tu conexión e intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      fecha: '',
      descripcion: '',
      observaciones: '',
      lugarCompra: '',
      valor: '' as any,
    });
  };

  const monthOptions = useMemo(() => {
    const unique = Array.from(
      new Set(reportes.map((reporte) => reporte.mes).filter(Boolean))
    );
    return unique.sort((a, b) => b.localeCompare(a));
  }, [reportes]);

  useEffect(() => {
    if (monthOptions.length === 0) return;
    setSelectedMonth((prev) => (prev ? prev : monthOptions[0]));
  }, [monthOptions]);

  const reportesDelMes = useMemo(() => {
    if (!selectedMonth) return reportes;
    return reportes.filter((reporte) => reporte.mes === selectedMonth);
  }, [reportes, selectedMonth]);

  const totalMes = useMemo(
    () => reportesDelMes.reduce((sum, r) => sum + r.valor, 0),
    [reportesDelMes]
  );

  const totalGeneral = useMemo(
    () => reportes.reduce((sum, r) => sum + r.valor, 0),
    [reportes]
  );

  const handleDownload = (reporte: Reporte) => {
    try {
      const pdf = new jsPDF();
      pdf.setFontSize(18);
      pdf.text('Reporte de Compra', 20, 20);

      pdf.setFontSize(12);
      const lineHeight = 10;
      let cursorY = 40;

      const rows = [
        { label: 'Fecha', value: new Date(reporte.fecha).toLocaleDateString('es-ES') },
        { label: 'Descripción', value: reporte.descripcion },
        { label: 'Lugar de compra', value: reporte.lugarCompra },
        {
          label: 'Valor',
          value: `$${reporte.valor.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        },
        { label: 'Observaciones', value: reporte.observaciones || '-' },
      ];

      rows.forEach(({ label, value }) => {
        pdf.text(`${label}:`, 20, cursorY);
        pdf.text(String(value), 70, cursorY, { maxWidth: 120 });
        cursorY += lineHeight;
      });

      pdf.save(`reporte-${reporte.id}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF', error);
      alert('No se pudo generar el PDF. Intenta nuevamente.');
    }
  };

  const handleDownloadMes = () => {
    if (!selectedMonth) {
      alert('Selecciona un mes para generar el PDF.');
      return;
    }

    if (reportesDelMes.length === 0) {
      alert('No hay reportes en este mes.');
      return;
    }

    try {
      const pdf = new jsPDF();
      pdf.setFontSize(18);
      pdf.text(`Reportes de ${formatMonth(selectedMonth)}`, 20, 20);
      pdf.setFontSize(12);

      let cursorY = 35;
      const lineHeight = 8;

      reportesDelMes.forEach((reporte, index) => {
        if (cursorY > 270) {
          pdf.addPage();
          cursorY = 20;
        }

        pdf.text(`Fecha: ${new Date(reporte.fecha).toLocaleDateString('es-ES')}`, 20, cursorY);
        cursorY += lineHeight;
        pdf.text(`Descripción: ${reporte.descripcion}`, 20, cursorY);
        cursorY += lineHeight;
        pdf.text(`Lugar: ${reporte.lugarCompra}`, 20, cursorY);
        cursorY += lineHeight;
        pdf.text(
          `Valor: $${reporte.valor.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          20,
          cursorY
        );
        cursorY += lineHeight;
        pdf.text(`Observaciones: ${reporte.observaciones || '-'}`, 20, cursorY, {
          maxWidth: 170,
        });
        cursorY += lineHeight + 4;
      });

      cursorY += 20;
      if (cursorY > 270) {
        pdf.addPage();
        cursorY = 20;
      }
      pdf.setFontSize(14);
      pdf.text(
        `Total del mes: $${totalMes.toLocaleString('es-ES', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        20,
        cursorY
      );

      pdf.save(`reportes-${selectedMonth}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF mensual', error);
      alert('No se pudo generar el PDF mensual. Intenta nuevamente.');
    }
  };

  const formatMonth = (monthKey: string) => {
    if (!monthKey) return '';
    const [year, month] = monthKey.split('-').map(Number);
    const formatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
    return formatter.format(new Date(year ?? 0, (month ?? 1) - 1));
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sistema de Reportes Mensuales</h1>
          <p className="text-gray-600">Gestiona tus reportes de compras y gastos del mes</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Mes activo</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex flex-col justify-center bg-blue-50 rounded-lg p-3">
              <span className="text-xs text-blue-700 uppercase tracking-wide">Total del mes</span>
              <span className="text-xl font-bold text-blue-900">
                ${totalMes.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
         
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleAdd}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Agregar Reporte
            </button>
            <button
              onClick={handleDownloadMes}
              disabled={reportesDelMes.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                />
              </svg>
              PDF del Mes
            </button>
          </div>
        </div>

        {/* Table */}
        <ReportesTable
          reportes={reportesDelMes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDownload={handleDownload}
        />

        {/* Empty State Button */}
        {reportesDelMes.length === 0 && (
          <div className="text-center mt-4">
            <button
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
            >
              Agregar tu primer reporte
            </button>
          </div>
        )}

        {/* Modal */}
        <ReporteForm
          isOpen={isModalOpen}
          editingId={editingId}
          formData={formData}
          onClose={handleCancel}
          onSave={handleSave}
          onChange={setFormData}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}


