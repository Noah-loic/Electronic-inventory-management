package com.example.EUCL.service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;

import com.example.EUCL.dto.DeviceAuditReport;
import com.example.EUCL.entity.Device;
import com.example.EUCL.entity.DeviceAssignment;
import com.example.EUCL.entity.DeviceStatusHistory;
import com.example.EUCL.entity.InventoryCheck;
import com.example.EUCL.repository.DeviceAssignmentRepository;
import com.example.EUCL.repository.DeviceRepository;
import com.example.EUCL.repository.DeviceStatusHistoryRepository;
import com.example.EUCL.repository.InventoryCheckRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeviceAuditService {

    private final DeviceRepository deviceRepository;
    private final DeviceAssignmentRepository assignmentRepository;
    private final DeviceStatusHistoryRepository statusHistoryRepository;
    private final InventoryCheckRepository inventoryCheckRepository;

    // fiscalYear = the year the fiscal year starts, e.g. 2024 means July 2024 → June 2025
    public List<DeviceAuditReport> getAuditReport(Long branchId, int fiscalYear) {
        LocalDateTime from = LocalDateTime.of(fiscalYear, 7, 1, 0, 0);
        LocalDateTime to = LocalDateTime.of(fiscalYear + 1, 6, 30, 23, 59, 59);

        List<Device> devices = deviceRepository.findByBranchId(branchId);
        if (devices.isEmpty())
            throw new EntityNotFoundException("No devices found for branch id: " + branchId);

        return devices.stream().map(device -> {
            InventoryCheck check = inventoryCheckRepository
                    .findByDeviceIdAndFiscalYear(device.getId(), fiscalYear).orElse(null);
            return new DeviceAuditReport(
                    device.getId(),
                    device.getTagNumber(),
                    device.getModel(),
                    device.getSerialNumber(),
                    device.getDeviceType(),
                    device.getStatus().name(),
                    device.getBranch().getName(),
                    assignmentRepository.findByBranchIdAndAssignedAtBetween(branchId, from, to)
                            .stream().filter(a -> a.getDevice().getId().equals(device.getId())).toList(),
                    statusHistoryRepository.findByDeviceIdAndChangedAtBetween(device.getId(), from, to),
                    check != null ? check.isPresent() : null,
                    check != null ? check.isWorking() : null,
                    check != null
            );
        }).toList();
    }

    public byte[] exportExcel(Long branchId, int fiscalYear) throws Exception {
        List<DeviceAuditReport> report = getAuditReport(branchId, fiscalYear);

        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            XSSFSheet sheet = wb.createSheet("Audit Report");

            // Styles
            XSSFCellStyle titleStyle = wb.createCellStyle();
            titleStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte)0x1F,(byte)0x39,(byte)0x64}, null));
            titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            XSSFFont titleFont = wb.createFont();
            titleFont.setBold(true); titleFont.setFontHeightInPoints((short)12);
            titleFont.setColor(new XSSFColor(new byte[]{(byte)0xFF,(byte)0xFF,(byte)0xFF}, null));
            titleStyle.setFont(titleFont);

            XSSFCellStyle subHeaderStyle = wb.createCellStyle();
            subHeaderStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte)0xE2,(byte)0xE8,(byte)0xF0}, null));
            subHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            XSSFFont subFont = wb.createFont(); subFont.setBold(true);
            subHeaderStyle.setFont(subFont);

            XSSFCellStyle labelStyle = wb.createCellStyle();
            XSSFFont labelFont = wb.createFont(); labelFont.setBold(true);
            labelStyle.setFont(labelFont);

            XSSFCellStyle greenStyle = wb.createCellStyle();
            greenStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte)0xD1,(byte)0xFA,(byte)0xE5}, null));
            greenStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            XSSFCellStyle redStyle = wb.createCellStyle();
            redStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte)0xFE,(byte)0xE2,(byte)0xE2}, null));
            redStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            int rowNum = 0;

            for (DeviceAuditReport d : report) {
                // Device title row
                Row titleRow = sheet.createRow(rowNum++);
                Cell titleCell = titleRow.createCell(0);
                titleCell.setCellValue(d.getTagNumber() + " — " + d.getModel() + " (" + d.getSerialNumber() + ")");
                titleCell.setCellStyle(titleStyle);
                sheet.addMergedRegion(new CellRangeAddress(titleRow.getRowNum(), titleRow.getRowNum(), 0, 6));

                // Device info
                String[][] info = {
                    {"Type", d.getDeviceType()}, {"Status", d.getCurrentStatus()}, {"Branch", d.getBranch()}
                };
                for (String[] pair : info) {
                    Row r = sheet.createRow(rowNum++);
                    Cell lbl = r.createCell(0); lbl.setCellValue(pair[0]); lbl.setCellStyle(labelStyle);
                    r.createCell(1).setCellValue(pair[1] != null ? pair[1] : "");
                }

                rowNum++; // blank

                // Assignment history
                Row aHeader = sheet.createRow(rowNum++);
                aHeader.createCell(0).setCellValue("Assignments");
                aHeader.getCell(0).setCellStyle(subHeaderStyle);
                sheet.addMergedRegion(new CellRangeAddress(aHeader.getRowNum(), aHeader.getRowNum(), 0, 4));

                String[] aCols = {"Employee", "Assigned At", "Unassigned At", "Assigned By", "Note"};
                Row aColRow = sheet.createRow(rowNum++);
                for (int i = 0; i < aCols.length; i++) {
                    Cell c = aColRow.createCell(i); c.setCellValue(aCols[i]); c.setCellStyle(labelStyle);
                }

                if (d.getAssignmentHistory() != null) {
                    for (DeviceAssignment a : d.getAssignmentHistory()) {
                        Row r = sheet.createRow(rowNum++);
                        r.createCell(0).setCellValue(a.getEmployee() != null ? a.getEmployee().getName() : "");
                        r.createCell(1).setCellValue(a.getAssignedAt() != null ? a.getAssignedAt().toString().replace('T',' ') : "");
                        r.createCell(2).setCellValue(a.getUnassignedAt() != null ? a.getUnassignedAt().toString().replace('T',' ') : "Active");
                        String assignedBy = a.getAssignedBy() != null
                            ? (a.getAssignedBy().getEmployee() != null ? a.getAssignedBy().getEmployee().getName() : a.getAssignedBy().getUsername())
                            : "";
                        r.createCell(3).setCellValue(assignedBy);
                        r.createCell(4).setCellValue(a.getNote() != null ? a.getNote() : "");
                    }
                }

                rowNum++; // blank

                // Status history
                Row sHeader = sheet.createRow(rowNum++);
                sHeader.createCell(0).setCellValue("Status Changes");
                sHeader.getCell(0).setCellStyle(subHeaderStyle);
                sheet.addMergedRegion(new CellRangeAddress(sHeader.getRowNum(), sHeader.getRowNum(), 0, 3));

                String[] sCols = {"Change", "Reason", "Changed By", "Changed At"};
                Row sColRow = sheet.createRow(rowNum++);
                for (int i = 0; i < sCols.length; i++) {
                    Cell c = sColRow.createCell(i); c.setCellValue(sCols[i]); c.setCellStyle(labelStyle);
                }

                if (d.getStatusHistory() != null) {
                    for (DeviceStatusHistory h : d.getStatusHistory()) {
                        Row r = sheet.createRow(rowNum++);
                        r.createCell(0).setCellValue(h.getOldStatus() + " → " + h.getNewStatus());
                        r.createCell(1).setCellValue(h.getReason() != null ? h.getReason() : "");
                        String changedBy = h.getChangedBy() != null
                            ? (h.getChangedBy().getEmployee() != null ? h.getChangedBy().getEmployee().getName() : h.getChangedBy().getUsername())
                            : "";
                        r.createCell(2).setCellValue(changedBy);
                        r.createCell(3).setCellValue(h.getChangedAt() != null ? h.getChangedAt().toString().replace('T',' ') : "");
                    }
                }

                rowNum++; // blank

                // Inventory check
                Row iHeader = sheet.createRow(rowNum++);
                iHeader.createCell(0).setCellValue("Inventory Check");
                iHeader.getCell(0).setCellStyle(subHeaderStyle);
                sheet.addMergedRegion(new CellRangeAddress(iHeader.getRowNum(), iHeader.getRowNum(), 0, 1));

                Row iRow = sheet.createRow(rowNum++);
                if (d.isInventoryChecked()) {
                    Cell pCell = iRow.createCell(0);
                    pCell.setCellValue("Present: " + (Boolean.TRUE.equals(d.getInventoryPresent()) ? "YES" : "NO"));
                    pCell.setCellStyle(Boolean.TRUE.equals(d.getInventoryPresent()) ? greenStyle : redStyle);
                    Cell wCell = iRow.createCell(1);
                    wCell.setCellValue("Working: " + (Boolean.TRUE.equals(d.getInventoryWorking()) ? "YES" : "NO"));
                    wCell.setCellStyle(Boolean.TRUE.equals(d.getInventoryWorking()) ? greenStyle : redStyle);
                } else {
                    iRow.createCell(0).setCellValue("No inventory check recorded");
                }

                rowNum += 2; // spacer between devices
            }

            for (int i = 0; i <= 6; i++) sheet.autoSizeColumn(i);
            wb.write(out);
            return out.toByteArray();
        }
    }
}
