package com.example.EUCL.service;

import com.example.EUCL.dto.BulkImportResult;
import com.example.EUCL.dto.DeviceRequest;
import com.example.EUCL.entity.Branch;
import com.example.EUCL.entity.Device;
import com.example.EUCL.enums.DeviceStatus;
import com.example.EUCL.repository.BranchRepository;
import com.example.EUCL.repository.DeviceRepository;
import com.example.EUCL.util.ExcelUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final BranchRepository branchRepository;

    public Device create(DeviceRequest request) {
        Device device = new Device();
        device.setTagNumber(request.getTagNumber());
        device.setModel(request.getModel());
        device.setSerialNumber(request.getSerialNumber());
        device.setDeviceType(request.getDeviceType());
        device.setStatus(request.getStatus() != null ? request.getStatus() : DeviceStatus.UNASSIGNED);
        device.setBranch(resolveHqBranch());
        return deviceRepository.save(device);
    }

    public List<Device> findAll() {
        return deviceRepository.findAll();
    }

    public Device findById(Long id) {
        return deviceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Device not found with id: " + id));
    }

    public List<Device> findByStatus(DeviceStatus status) {
        return deviceRepository.findByStatus(status);
    }

    public List<Device> findByBranch(Long branchId) {
        return deviceRepository.findByBranchId(branchId);
    }

    public Device update(Long id, DeviceRequest request) {
        Device device = findById(id);
        device.setTagNumber(request.getTagNumber());
        device.setModel(request.getModel());
        device.setSerialNumber(request.getSerialNumber());
        device.setDeviceType(request.getDeviceType());
        if (request.getStatus() != null) {
            device.setStatus(request.getStatus());
            if (request.getStatus() != DeviceStatus.ACTIVE) {
                device.setBranch(resolveHqBranch());
            }
        }
        return deviceRepository.save(device);
    }

    private com.example.EUCL.entity.Branch resolveHqBranch() {
        return branchRepository.findFirstByNameContainingIgnoreCase("HQ")
                .orElseGet(() -> branchRepository.findAll().get(0));
    }

    public void delete(Long id) {
        deviceRepository.delete(findById(id));
    }

    public byte[] generateTemplate() throws Exception {
        List<String> branches = branchRepository.findAll().stream().map(Branch::getName).toList();
        String[] statuses = {"UNASSIGNED", "ACTIVE", "IN_REPAIR", "DECOMMISSIONED"};

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Hidden ref sheet
            Sheet refSheet = workbook.createSheet("_ref");
            workbook.setSheetHidden(workbook.getSheetIndex("_ref"), true);
            for (int i = 0; i < branches.size(); i++) {
                refSheet.createRow(i).createCell(0).setCellValue(branches.get(i));
            }
            for (int i = 0; i < statuses.length; i++) {
                Row r = refSheet.getRow(i) != null ? refSheet.getRow(i) : refSheet.createRow(i);
                r.createCell(1).setCellValue(statuses[i]);
            }

            Sheet sheet = workbook.createSheet("devices");
            Row header = sheet.createRow(0);
            String[] headers = {"Tag Number", "Model", "Serial Number", "Device Type", "Status", "Branch Name"};
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            DataValidationHelper dvHelper = sheet.getDataValidationHelper();

            // Branch dropdown (col 5) rows 2-1001
            if (!branches.isEmpty()) {
                String branchFormula = "_ref!$A$1:$A$" + branches.size();
                DataValidationConstraint branchConstraint = dvHelper.createFormulaListConstraint(branchFormula);
                DataValidation branchValidation = dvHelper.createValidation(branchConstraint, new CellRangeAddressList(1, 1000, 5, 5));
                branchValidation.setShowErrorBox(true);
                sheet.addValidationData(branchValidation);
            }

            // Status dropdown (col 4) rows 2-1001
            String statusFormula = "_ref!$B$1:$B$" + statuses.length;
            DataValidationConstraint statusConstraint = dvHelper.createFormulaListConstraint(statusFormula);
            DataValidation statusValidation = dvHelper.createValidation(statusConstraint, new CellRangeAddressList(1, 1000, 4, 4));
            statusValidation.setShowErrorBox(true);
            sheet.addValidationData(statusValidation);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public BulkImportResult importFromExcel(MultipartFile file) throws Exception {
        BulkImportResult result = new BulkImportResult();
        Set<String> seenTags = new HashSet<>();
        Set<String> seenSerials = new HashSet<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (ExcelUtils.isRowEmpty(row)) continue;
                int rowNum = i + 1;

                String tagNumber   = ExcelUtils.getString(row, 0);
                String model       = ExcelUtils.getString(row, 1);
                String serialNumber = ExcelUtils.getString(row, 2);
                String deviceType  = ExcelUtils.getString(row, 3);
                String statusStr   = ExcelUtils.getString(row, 4);
                String branchName  = ExcelUtils.getString(row, 5);

                if (tagNumber == null)    { result.addFailure(rowNum, "Tag Number is required"); continue; }
                if (model == null)        { result.addFailure(rowNum, "Model is required"); continue; }
                if (serialNumber == null) { result.addFailure(rowNum, "Serial Number is required"); continue; }
                if (deviceType == null)   { result.addFailure(rowNum, "Device Type is required"); continue; }
                if (branchName == null)   { result.addFailure(rowNum, "Branch Name is required"); continue; }

                if (!seenTags.add(tagNumber)) {
                    result.addFailure(rowNum, "Duplicate Tag Number in file: " + tagNumber); continue;
                }
                if (!seenSerials.add(serialNumber)) {
                    result.addFailure(rowNum, "Duplicate Serial Number in file: " + serialNumber); continue;
                }
                if (deviceRepository.findByTagNumber(tagNumber).isPresent()) {
                    result.addFailure(rowNum, "Tag Number already exists in DB: " + tagNumber); continue;
                }
                if (deviceRepository.findBySerialNumber(serialNumber).isPresent()) {
                    result.addFailure(rowNum, "Serial Number already exists in DB: " + serialNumber); continue;
                }

                DeviceStatus status = DeviceStatus.UNASSIGNED;
                if (statusStr != null) {
                    try {
                        status = DeviceStatus.valueOf(statusStr.toUpperCase());
                    } catch (IllegalArgumentException e) {
                        result.addFailure(rowNum, "Invalid status '" + statusStr + "'. Valid values: ACTIVE, IN_REPAIR, DECOMMISSIONED, UNASSIGNED"); continue;
                    }
                }

                var branch = branchRepository.findByNameIgnoreCase(branchName).orElse(null);
                if (branch == null) { result.addFailure(rowNum, "Branch not found: " + branchName); continue; }

                Device device = new Device();
                device.setTagNumber(tagNumber);
                device.setModel(model);
                device.setSerialNumber(serialNumber);
                device.setDeviceType(deviceType);
                device.setStatus(status);
                device.setBranch(branch);
                deviceRepository.save(device);
                result.addSuccess();
            }
        }
        return result;
    }
}
