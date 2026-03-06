import { generateFinalAuditData } from '../services/reportService.js';
import { generateAuditoriaExcel } from '../services/excelService.js'; // Asegúrate de importar tu servicio de Excel

export const getFinalReport = async (req, res) => {
    console.log("!!! PETICIÓN RECIBIDA EN CONTROLADOR DE REPORTES !!!");
    
    const { inicio, fin, estado, exportar } = req.query; // Extraemos el parámetro exportar

    if (!inicio || !fin) {
        return res.status(400).json({ success: false, message: 'Fechas obligatorias' });
    }

    try {
        const reportData = await generateFinalAuditData(inicio, fin, { estado });

        // 1. Extraemos las filas reales del recordset
        const rows = reportData.detalles?.recordset || reportData.detalles || [];

        // 2. CÁLCULO SENIOR: Generamos métricas basadas en la data de Carlos Avila
        const total_cotizado = rows.reduce((acc, row) => acc + Number(row.total_cotizado || 0), 0);
        const total_recaudado = rows.reduce((acc, row) => acc + Number(row.total_recaudado || 0), 0);
        const finalizadas = rows.filter(row => row.estado === 'ENTREGADO').length;
        const garantias = rows.filter(row => Number(row.indice_garantia) > 0).length;

        const eficiencia = total_cotizado > 0 
            ? ((total_recaudado / total_cotizado) * 100).toFixed(2) + '%' 
            : '0.00%';

        const metricasFinales = {
            total_ordenes: rows.length,
            monto_total_cotizado: total_cotizado,
            monto_total_recaudado: total_recaudado,
            ordenes_finalizadas: finalizadas,
            total_garantias: garantias,
            eficiencia_cobro: eficiencia
        };

        const dataCompleta = { metricas: metricasFinales, detalles: rows };

        // 3. INTERRUPTOR DE EXCEL: Si viene el parámetro exportar, enviamos el BUFFER
        if (exportar === 'excel') {
            const buffer = await generateAuditoriaExcel(dataCompleta, { inicio, fin });
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Auditoria_Taller.xlsx`);
            
            // Usamos res.send(buffer) para enviar el binario real
            return res.send(buffer);
        }

        // 4. RESPUESTA NORMAL: Si no es excel, enviamos JSON al Dashboard
        console.log(">> Enviando JSON al Dashboard:", metricasFinales);
        res.json({
            success: true,
            metricas: metricasFinales,
            detalles: rows
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error interno' });
    }
};