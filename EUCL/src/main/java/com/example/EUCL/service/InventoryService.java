package com.example.EUCL.service;

import com.example.EUCL.dto.BulkImportResult;
import com.example.EUCL.dto.InventoryCheckRequest;
import com.example.EUCL.dto.InventoryRowDto;
import com.example.EUCL.entity.Device;
import com.example.EUCL.entity.InventoryCheck;
import com.example.EUCL.enums.DeviceStatus;
import com.example.EUCL.repository.DeviceAssignmentRepository;
import com.example.EUCL.repository.DeviceRepository;
import com.example.EUCL.repository.InventoryCheckRepository;
import com.example.EUCL.repository.RepairRequestRepository;
import com.example.EUCL.util.ExcelUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final DeviceRepository deviceRepository;
    private final DeviceAssignmentRepository assignmentRepository;
    private final InventoryCheckRepository inventoryCheckRepository;
    private final RepairRequestRepository repairRequestRepository;

    public List<InventoryRowDto> getInventory(Long branchId, int fiscalYear) {
        List<Device> devices = deviceRepository.findByBranchId(branchId);

        // Load all existing checks for this branch+year into a map for O(1) lookup
        Map<Long, InventoryCheck> checkMap = inventoryCheckRepository
                .findByDevice_BranchIdAndFiscalYear(branchId, fiscalYear)
                .stream()
                .collect(Collectors.toMap(c -> c.getDevice().getId(), c -> c));

        return devices.stream().map(device -> {
            InventoryRowDto row = new InventoryRowDto();
            row.setDeviceId(device.getId());
            row.setTagNumber(device.getTagNumber());
            row.setModel(device.getModel());
            row.setSerialNumber(device.getSerialNumber());
            row.setDeviceType(device.getDeviceType());
            row.setCurrentStatus(device.getStatus().name());
            row.setBranchName(device.getBranch().getName());
            // current branch always comes from device.branch (kept in sync by assignment/unassign/employee branch update)
            row.setCurrentBranchName(device.getBranch().getName());

            // Active assignment
            assignmentRepository.findByDeviceIdAndIsActiveTrue(device.getId()).ifPresent(a -> {
                row.setAssignedEmployeeName(a.getEmployee().getName());
                row.setAssignedEmployeeId(a.getEmployee().getEmployeeId());
                row.setAssignedAt(a.getAssignedAt());
                row.setAssignedByName(a.getAssignedBy().getEmployee() != null
                        ? a.getAssignedBy().getEmployee().getName()
                        : a.getAssignedBy().getUsername());
                row.setAssignmentNote(a.getNote());
            });

            // Non-ACTIVE devices are physically at HQ
            if (device.getStatus() != DeviceStatus.ACTIVE) {
                row.setCurrentBranchName("Nrarugenge HQ");
            }

            // Inventory check state
            InventoryCheck check = checkMap.get(device.getId());
            if (check != null) {
                row.setInventoryCheckId(check.getId());
                row.setPresent(check.isPresent());
                row.setWorking(check.isWorking());
            }

            // Latest repair request
            repairRequestRepository.findByDevice_IdOrderByRequestedAtDesc(device.getId())
                    .stream().findFirst().ifPresent(r -> {
                        row.setRepairStatus(r.getStatus().name());
                        row.setRepairRequestedBy(r.getRequestedBy().getEmployee() != null
                                ? r.getRequestedBy().getEmployee().getName()
                                : r.getRequestedBy().getUsername());
                        if (r.getHandledBy() != null) {
                            row.setRepairHandledBy(r.getHandledBy().getEmployee() != null
                                    ? r.getHandledBy().getEmployee().getName()
                                    : r.getHandledBy().getUsername());
                        }
                    });

            return row;
        }).toList();
    }

    @Transactional
    public InventoryRowDto saveCheck(InventoryCheckRequest request) {
        Device device = deviceRepository.findById(request.getDeviceId())
                .orElseThrow(() -> new EntityNotFoundException("Device not found: " + request.getDeviceId()));

        InventoryCheck check = inventoryCheckRepository
                .findByDeviceIdAndFiscalYear(request.getDeviceId(), request.getFiscalYear())
                .orElseGet(() -> {
                    InventoryCheck c = new InventoryCheck();
                    c.setDevice(device);
                    c.setFiscalYear(request.getFiscalYear());
                    return c;
                });

        check.setPresent(request.isPresent());
        check.setWorking(request.isWorking());
        inventoryCheckRepository.save(check);

        // Return updated row
        List<InventoryRowDto> rows = getInventory(device.getBranch().getId(), request.getFiscalYear());
        return rows.stream()
                .filter(r -> r.getDeviceId().equals(request.getDeviceId()))
                .findFirst()
                .orElseThrow();
    }

    public byte[] generateTemplate(Long branchId, int fiscalYear) throws Exception {
        List<InventoryRowDto> rows = getInventory(branchId, fiscalYear);

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("inventory");

            // Header style — dark navy
            XSSFCellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte)0x1F, (byte)0x39, (byte)0x64}, null));
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            XSSFFont headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(new XSSFColor(new byte[]{(byte)0xFF, (byte)0xFF, (byte)0xFF}, null));
            headerFont.setFontHeightInPoints((short) 11);
            headerStyle.setFont(headerFont);

            // Read-only info columns — light gray + locked
            XSSFCellStyle lockedStyle = workbook.createCellStyle();
            lockedStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte)0xF3, (byte)0xF4, (byte)0xF6}, null));
            lockedStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            lockedStyle.setLocked(true);

            // Editable columns — green tint + unlocked
            XSSFCellStyle editableStyle = workbook.createCellStyle();
            editableStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte)0xF0, (byte)0xFD, (byte)0xF4}, null));
            editableStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            editableStyle.setLocked(false);

            // Columns match the inventory table exactly (no # column)
            String[] headers = {
                "Tag No.", "Model", "Serial No.", "Type", "Status",
                "Current Branch", "Assigned To", "Employee ID", "Assigned At",
                "Assigned By", "Note", "Repair Status", "Requested By", "Handled By",
                "Present (YES/NO)", "Working (YES/NO)"
            };
            int[] colWidths = {4000, 5500, 5000, 4000, 4000, 4500, 5000, 4000, 5500, 4500, 4000, 4000, 4500, 4500, 5000, 5000};

            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(18);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, colWidths[i]);
            }

            // YES/NO dropdown on Present (col 14) and Working (col 15)
            if (!rows.isEmpty()) {
                DataValidationHelper dvHelper = sheet.getDataValidationHelper();
                DataValidationConstraint yesNo = dvHelper.createExplicitListConstraint(new String[]{"YES", "NO"});
                DataValidation pv = dvHelper.createValidation(yesNo, new CellRangeAddressList(1, rows.size(), 14, 14));
                DataValidation wv = dvHelper.createValidation(yesNo, new CellRangeAddressList(1, rows.size(), 15, 15));
                pv.setShowErrorBox(true);
                wv.setShowErrorBox(true);
                sheet.addValidationData(pv);
                sheet.addValidationData(wv);
            }

            for (int i = 0; i < rows.size(); i++) {
                InventoryRowDto r = rows.get(i);
                Row row = sheet.createRow(i + 1);

                String assignedAt = r.getAssignedAt() != null ? r.getAssignedAt().toString().replace('T', ' ') : "";

                String[] values = {
                    r.getTagNumber(),
                    r.getModel(),
                    r.getSerialNumber(),
                    r.getDeviceType(),
                    r.getCurrentStatus(),
                    r.getCurrentBranchName() != null ? r.getCurrentBranchName() : "",
                    r.getAssignedEmployeeName() != null ? r.getAssignedEmployeeName() : "",
                    r.getAssignedEmployeeId() != null ? r.getAssignedEmployeeId() : "",
                    assignedAt,
                    r.getAssignedByName() != null ? r.getAssignedByName() : "",
                    r.getAssignmentNote() != null ? r.getAssignmentNote() : "",
                    r.getRepairStatus() != null ? r.getRepairStatus() : "",
                    r.getRepairRequestedBy() != null ? r.getRepairRequestedBy() : "",
                    r.getRepairHandledBy() != null ? r.getRepairHandledBy() : "",
                    r.isPresent() ? "YES" : "NO",
                    r.isWorking() ? "YES" : "NO"
                };

                for (int c = 0; c < values.length; c++) {
                    Cell cell = row.createCell(c);
                    cell.setCellValue(values[c]);
                    cell.setCellStyle(c < 14 ? lockedStyle : editableStyle);
                }
            }

            // Protect sheet — only unlocked cells (Present/Working) are editable
            ((XSSFSheet) sheet).protectSheet("");
            ((XSSFSheet) sheet).lockSelectLockedCells(false);
            ((XSSFSheet) sheet).lockSelectUnlockedCells(false);
            workbook.write(out);
            return out.toByteArray();
        }
    }

    @Transactional
    public BulkImportResult bulkImport(MultipartFile file, Long branchId, int fiscalYear) throws Exception {
        BulkImportResult result = new BulkImportResult();
        // Build tag→device map for this branch
        Map<String, Device> deviceByTag = deviceRepository.findByBranchId(branchId)
                .stream().collect(Collectors.toMap(Device::getTagNumber, d -> d));

        try (org.apache.poi.ss.usermodel.Workbook workbook = org.apache.poi.ss.usermodel.WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheet("inventory");
            if (sheet == null) sheet = workbook.getSheetAt(0);

            Row headerRow = sheet.getRow(0);
            java.util.Map<String, Integer> colIndex = new java.util.HashMap<>();
            if (headerRow != null) {
                for (Cell cell : headerRow) {
                    String n = ExcelUtils.getString(headerRow, cell.getColumnIndex());
                    if (n != null) colIndex.put(n.toLowerCase().replaceAll("[\\s_()/]+", ""), cell.getColumnIndex());
                }
            }
            int idxTag     = colIndex.getOrDefault("tagno", 0);
            int idxPresent = colIndex.getOrDefault("presentyesno", 14);
            int idxWorking = colIndex.getOrDefault("workingyesno", 15);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (ExcelUtils.isRowEmpty(row)) continue;
                int rowNum = i + 1;

                String tagNumber = ExcelUtils.getString(row, idxTag);
                String presentStr = ExcelUtils.getString(row, idxPresent);
                String workingStr = ExcelUtils.getString(row, idxWorking);

                if (tagNumber == null) { result.addFailure(rowNum, "Tag Number is required"); continue; }
                if (presentStr == null) { result.addFailure(rowNum, "Present value is required"); continue; }
                if (workingStr == null) { result.addFailure(rowNum, "Working value is required"); continue; }
                if (!presentStr.equalsIgnoreCase("YES") && !presentStr.equalsIgnoreCase("NO")) {
                    result.addFailure(rowNum, "Present must be YES or NO"); continue;
                }
                if (!workingStr.equalsIgnoreCase("YES") && !workingStr.equalsIgnoreCase("NO")) {
                    result.addFailure(rowNum, "Working must be YES or NO"); continue;
                }

                Device device = deviceByTag.get(tagNumber);
                if (device == null) { result.addFailure(rowNum, "Device not found in this branch: " + tagNumber); continue; }

                InventoryCheck check = inventoryCheckRepository
                        .findByDeviceIdAndFiscalYear(device.getId(), fiscalYear)
                        .orElseGet(() -> { InventoryCheck c = new InventoryCheck(); c.setDevice(device); c.setFiscalYear(fiscalYear); return c; });
                check.setPresent(presentStr.equalsIgnoreCase("YES"));
                check.setWorking(workingStr.equalsIgnoreCase("YES"));
                inventoryCheckRepository.save(check);
                result.addSuccess();
            }
        }
        return result;
    }
}
