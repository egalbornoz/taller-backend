import ExcelJS from 'exceljs';

/**
 * Genera un Buffer de Excel con la auditoría gerencial
 * @param {Object} reportData - Contiene metricas y detalles
 * @param {Object} rango - Fechas inicio y fin
 */
export const generateAuditoriaExcel = async (reportData, rango) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Auditoría Gerencial');

    // 1. Configuración de Columnas (Anchos)
    worksheet.columns = [
        { header: 'ID ORDEN', key: 'orden_id', width: 15 },
        { header: 'CLIENTE', key: 'cliente', width: 35 },
        { header: 'ESTADO', key: 'estado', width: 20 },
        { header: 'MONTO PRESUPUESTO', key: 'total_cotizado', width: 25 },
        { header: 'FECHA APERTURA', key: 'fecha_apertura', width: 25 },
        { header: 'GARANTÍA', key: 'es_garantia', width: 15 }
    ];

    // 2. Título del Reporte
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `REPORTE DE AUDITORÍA - TALLER INGCOTEC (${rango.inicio} AL ${rango.fin})`;
    titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    titleCell.alignment = { horizontal: 'center' };

    // 3. Resumen de Métricas (Cuadro de Totales)
    worksheet.addRow([]); // Espacio
    const metricas = reportData.metricas;
    const metricRowHeaders = worksheet.addRow(['Órdenes Totales', 'Monto Cotizado', 'Total Recaudado', 'Eficiencia', 'Garantías']);
    const metricRowValues = worksheet.addRow([
        metricas.total_ordenes,
        `$ ${Number(metricas.monto_total_cotizado).toFixed(2)}`,
        `$ ${Number(metricas.monto_total_recaudado).toFixed(2)}`,
        metricas.eficiencia_cobro,
        metricas.total_garantias
    ]);

    // Estilo para el resumen
    metricRowHeaders.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    });

    worksheet.addRow([]); // Espacio

    // 4. Encabezados de la Tabla de Detalles
    const headerRow = worksheet.addRow(['ID ORDEN', 'CLIENTE', 'ESTADO', 'MONTO PRESUPUESTO', 'FECHA APERTURA', 'TIPO']);
    headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
        cell.alignment = { horizontal: 'center' };
    });

    // 5. Carga de Datos (Usando los nombres reales de tu SQL)
    if (reportData.detalles && reportData.detalles.length > 0) {
        reportData.detalles.forEach(row => {
            const rowData = worksheet.addRow([
                `#${String(row.orden_id).padStart(4, '0')}`, // orden_id del recordset
                (row.cliente || 'SIN CLIENTE').toUpperCase(), // cliente del recordset
                row.estado,                                  //
                Number(row.total_cotizado || 0),             //
                row.fecha_apertura,                          //
                Number(row.indice_garantia) > 0 ? 'SÍ' : 'NO' //
            ]);

            // Formato de moneda para la columna D
            rowData.getCell(4).numFmt = '"$"#,##0.00';
        });
    } else {
        worksheet.addRow(['No se encontraron registros en este rango.']);
    }

    // 6. Generar y Retornar el Buffer
    return await workbook.xlsx.writeBuffer();
};