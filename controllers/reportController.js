import { generateFinalAuditData } from '../services/reportService.js';
import { generateExcelBuffer } from '../services/excelService.js';

export const getFinalReport = async (req, res) => {
    // 1. Extraemos variables de la URL
    const { inicio, fin, exportar, estado, vendedor_id } = req.query;
    
    // 2. Capturamos la paginación (con valores por defecto seguros)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    try {
        const filtros = { estado, vendedor_id };
        const isExporting = exportar === 'excel';

        // 3. Llamamos al servicio (Si exporta, pasamos null a page/limit para traer todo)
        const reportData = await generateFinalAuditData(
            inicio, 
            fin, 
            filtros, 
            isExporting ? null : page, 
            isExporting ? null : limit
        );

        // 4. Lógica de exportación a Excel
        if (isExporting) {
            const buffer = await generateExcelBuffer(reportData);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Auditoria_${inicio}_al_${fin}.xlsx`);
            return res.send(buffer);
        }

        // 5. Respuesta JSON normal (Paginada) para la web
        return res.json({
            success: true,
            rango: { inicio, fin },
            filtros_aplicados: filtros,
            metricas: reportData.metricas,
            paginacion: reportData.paginacion,
            detalles: reportData.detalles 
        });

    } catch (error) {
        console.error('[Report Module - getFinalReport]:', error);
        return res.status(500).json({ message: 'Error interno al generar el reporte' });
    }
};