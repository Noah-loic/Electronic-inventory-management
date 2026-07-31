package com.example.EUCL.service;

import com.example.EUCL.dto.BulkImportResult;
import com.example.EUCL.dto.EmployeeRequest;
import com.example.EUCL.entity.Branch;
import com.example.EUCL.entity.Department;
import com.example.EUCL.entity.Employee;
import com.example.EUCL.repository.BranchRepository;
import com.example.EUCL.repository.DepartmentRepository;
import com.example.EUCL.repository.EmployeeRepository;
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
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final BranchRepository branchRepository;

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

    public Employee update(Long id, EmployeeRequest request) {
        Employee employee = findById(id);
        employee.setEmployeeId(request.getEmployeeId());
        employee.setName(request.getName());
        employee.setDepartment(departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Department not found")));
        employee.setBranch(branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new EntityNotFoundException("Branch not found")));
        return employeeRepository.save(employee);
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
            int maxRows = Math.max(branches.size(), departments.size());
            for (int i = 0; i < maxRows; i++) {
                Row r = refSheet.createRow(i);
                if (i < departments.size()) r.createCell(0).setCellValue(departments.get(i));
                if (i < branches.size())    r.createCell(1).setCellValue(branches.get(i));
            }

            Sheet sheet = workbook.createSheet("employees");
            Row header = sheet.createRow(0);
            String[] headers = {"Employee ID", "Name", "Department Name", "Branch Name"};
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

            // Department dropdown (col 2)
            if (!departments.isEmpty()) {
                String deptFormula = "_ref!$A$1:$A$" + departments.size();
                DataValidationConstraint deptConstraint = dvHelper.createFormulaListConstraint(deptFormula);
                DataValidation deptValidation = dvHelper.createValidation(deptConstraint, new CellRangeAddressList(1, 1000, 2, 2));
                deptValidation.setShowErrorBox(true);
                sheet.addValidationData(deptValidation);
            }

            // Branch dropdown (col 3)
            if (!branches.isEmpty()) {
                String branchFormula = "_ref!$B$1:$B$" + branches.size();
                DataValidationConstraint branchConstraint = dvHelper.createFormulaListConstraint(branchFormula);
                DataValidation branchValidation = dvHelper.createValidation(branchConstraint, new CellRangeAddressList(1, 1000, 3, 3));
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
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (ExcelUtils.isRowEmpty(row)) continue;
                int rowNum = i + 1;

                String employeeId    = ExcelUtils.getString(row, 0);
                String name          = ExcelUtils.getString(row, 1);
                String departmentName = ExcelUtils.getString(row, 2);
                String branchName    = ExcelUtils.getString(row, 3);

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
