package com.example.EUCL.service;

import com.example.EUCL.dto.BulkImportResult;
import com.example.EUCL.dto.EmployeeRequest;
import com.example.EUCL.entity.Branch;
import com.example.EUCL.entity.Department;
import com.example.EUCL.entity.Employee;
import com.example.EUCL.repository.BranchRepository;
import com.example.EUCL.repository.DepartmentRepository;
import com.example.EUCL.repository.DeviceAssignmentRepository;
import com.example.EUCL.repository.DeviceRepository;
import com.example.EUCL.repository.EmployeeRepository;
import com.example.EUCL.util.ExcelUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final BranchRepository branchRepository;
    private final DeviceAssignmentRepository assignmentRepository;
    private final DeviceRepository deviceRepository;

    public Employee create(EmployeeRequest request) {
        Employee employee = new Employee();
        employee.setEmployeeId(request.getEmployeeId());
        employee.setName(request.getName());
        employee.setDepartment(departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Department not found")));
        employee.setBranch(branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new EntityNotFoundException("Branch not found")));
        return employeeRepository.save(employee);
    }

    public List<Employee> findAll() {
        return employeeRepository.findAll();
    }

    public Employee findById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + id));
    }

    public List<Employee> findByDepartment(Long departmentId) {
        return employeeRepository.findByDepartmentId(departmentId);
    }

    public List<Employee> findByBranch(Long branchId) {
        return employeeRepository.findByBranchId(branchId);
    }

    @org.springframework.transaction.annotation.Transactional
    public Employee update(Long id, EmployeeRequest request) {
        Employee employee = findById(id);
        employee.setEmployeeId(request.getEmployeeId());
        employee.setName(request.getName());
        employee.setDepartment(departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Department not found")));
        employee.setBranch(branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new EntityNotFoundException("Branch not found")));
        employeeRepository.save(employee);

        // sync active assigned devices to the new branch
        assignmentRepository.findByEmployeeIdAndIsActiveTrue(employee.getId())
                .forEach(a -> {
                    a.getDevice().setBranch(employee.getBranch());
                    deviceRepository.save(a.getDevice());
                });

        return employee;
    }

    public void delete(Long id) {
        employeeRepository.delete(findById(id));
    }

    public byte[] generateTemplate() throws Exception {
        List<String> branches = branchRepository.findAll().stream().map(Branch::getName).toList();
        List<String> departments = departmentRepository.findAll().stream().map(Department::getName).toList();

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Hidden ref sheet
            Sheet refSheet = workbook.createSheet("_ref");
            workbook.setSheetHidden(workbook.getSheetIndex("_ref"), true);
            Row refHeader = refSheet.createRow(0);
            refHeader.createCell(0).setCellValue("Department Names");
            refHeader.createCell(1).setCellValue("Branch Names");
            int maxRows = Math.max(branches.size(), departments.size());
            for (int i = 0; i < maxRows; i++) {
                Row r = refSheet.createRow(i + 1);
                if (i < departments.size()) r.createCell(0).setCellValue(departments.get(i));
                if (i < branches.size())    r.createCell(1).setCellValue(branches.get(i));
            }

            Sheet sheet = workbook.createSheet("employees");

            // Header style — dark navy background, white bold centered text
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

            // Example row style — italic, gray text
            XSSFCellStyle exampleStyle = workbook.createCellStyle();
            XSSFFont exampleFont = workbook.createFont();
            exampleFont.setItalic(true);
            exampleFont.setColor(new XSSFColor(new byte[]{(byte)0x80, (byte)0x80, (byte)0x80}, null));
            exampleStyle.setFont(exampleFont);

            // Alternating row style — light blue background
            XSSFCellStyle bandStyle = workbook.createCellStyle();
            bandStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte)0xDD, (byte)0xE8, (byte)0xF5}, null));
            bandStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] headers = {"Employee ID", "Name", "Department Name", "Branch Name"};
            int[] colWidths = {4500, 6000, 5500, 5000};

            Row header = sheet.createRow(0);
            header.setHeightInPoints(18);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, colWidths[i]);
            }

            // Example data row
            String[] example = {"EMP-0001", "Jane Uwimana", "IT", "HQ"};
            Row exRow = sheet.createRow(1);
            for (int i = 0; i < example.length; i++) {
                Cell cell = exRow.createCell(i);
                cell.setCellValue(example[i]);
                cell.setCellStyle(exampleStyle);
            }

            // Apply alternating banding to remaining rows (2-1000)
            for (int r = 2; r <= 1000; r++) {
                if (r % 2 == 0) {
                    Row row = sheet.createRow(r);
                    for (int c = 0; c < headers.length; c++) row.createCell(c).setCellStyle(bandStyle);
                }
            }

            DataValidationHelper dvHelper = sheet.getDataValidationHelper();

            // Department dropdown (col 2)
            if (!departments.isEmpty()) {
                String deptFormula = "_ref!$A$2:$A$" + (departments.size() + 1);
                DataValidationConstraint deptConstraint = dvHelper.createFormulaListConstraint(deptFormula);
                DataValidation deptValidation = dvHelper.createValidation(deptConstraint, new CellRangeAddressList(2, 1000, 2, 2));
                deptValidation.setShowErrorBox(true);
                sheet.addValidationData(deptValidation);
            }

            // Branch dropdown (col 3)
            if (!branches.isEmpty()) {
                String branchFormula = "_ref!$B$2:$B$" + (branches.size() + 1);
                DataValidationConstraint branchConstraint = dvHelper.createFormulaListConstraint(branchFormula);
                DataValidation branchValidation = dvHelper.createValidation(branchConstraint, new CellRangeAddressList(2, 1000, 3, 3));
                branchValidation.setShowErrorBox(true);
                sheet.addValidationData(branchValidation);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public BulkImportResult importFromExcel(MultipartFile file) throws Exception {
        BulkImportResult result = new BulkImportResult();
        Set<String> seenIds = new HashSet<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheet("employees");
            if (sheet == null) sheet = workbook.getSheetAt(0);
            // Build header index map (case-insensitive, ignore spaces/underscores)
            Row headerRow = sheet.getRow(0);
            java.util.Map<String, Integer> colIndex = new java.util.HashMap<>();
            if (headerRow != null) {
                for (Cell cell : headerRow) {
                    String n = ExcelUtils.getString(headerRow, cell.getColumnIndex());
                    if (n != null) colIndex.put(n.toLowerCase().replaceAll("[\\s_]+", ""), cell.getColumnIndex());
                }
            }
            int idxId     = colIndex.getOrDefault("employeeid", 0);
            int idxName   = colIndex.getOrDefault("name", 1);
            int idxDept   = colIndex.getOrDefault("departmentname", 2);
            int idxBranch = colIndex.getOrDefault("branchname", 3);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (ExcelUtils.isRowEmpty(row)) continue;
                int rowNum = i + 1;

                String employeeId     = ExcelUtils.getString(row, idxId);
                String name           = ExcelUtils.getString(row, idxName);
                String departmentName = ExcelUtils.getString(row, idxDept);
                String branchName     = ExcelUtils.getString(row, idxBranch);

                // Skip example row
                if ("EMP-0001".equalsIgnoreCase(employeeId) && "Jane Uwimana".equalsIgnoreCase(name)) continue;

                if (employeeId == null)     { result.addFailure(rowNum, "Employee ID is required"); continue; }
                if (name == null)           { result.addFailure(rowNum, "Name is required"); continue; }
                if (departmentName == null) { result.addFailure(rowNum, "Department Name is required"); continue; }
                if (branchName == null)     { result.addFailure(rowNum, "Branch Name is required"); continue; }

                if (!seenIds.add(employeeId)) {
                    result.addFailure(rowNum, "Duplicate Employee ID in file: " + employeeId); continue;
                }
                if (employeeRepository.findByEmployeeId(employeeId).isPresent()) {
                    result.addFailure(rowNum, "Employee ID already exists in DB: " + employeeId); continue;
                }

                var department = departmentRepository.findByNameIgnoreCase(departmentName).orElse(null);
                if (department == null) { result.addFailure(rowNum, "Department not found: " + departmentName); continue; }

                var branch = branchRepository.findByNameIgnoreCase(branchName).orElse(null);
                if (branch == null) { result.addFailure(rowNum, "Branch not found: " + branchName); continue; }

                Employee employee = new Employee();
                employee.setEmployeeId(employeeId);
                employee.setName(name);
                employee.setDepartment(department);
                employee.setBranch(branch);
                employeeRepository.save(employee);
                result.addSuccess();
            }
        }
        return result;
    }
}
