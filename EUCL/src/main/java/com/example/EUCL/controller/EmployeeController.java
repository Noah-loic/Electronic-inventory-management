package com.example.EUCL.controller;

import com.example.EUCL.dto.BulkImportResult;
import com.example.EUCL.dto.EmployeeRequest;
import com.example.EUCL.entity.Employee;
import com.example.EUCL.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_CREATE')")
    @ResponseStatus(HttpStatus.CREATED)
    public Employee create(@RequestBody EmployeeRequest request) {
        return employeeService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_READ')")
    public List<Employee> findAll() {
        return employeeService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_READ')")
    public Employee findById(@PathVariable Long id) {
        return employeeService.findById(id);
    }

    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasAuthority('EMPLOYEE_READ')")
    public List<Employee> findByDepartment(@PathVariable Long departmentId) {
        return employeeService.findByDepartment(departmentId);
    }

    @GetMapping("/branch/{branchId}")
    @PreAuthorize("hasAuthority('EMPLOYEE_READ')")
    public List<Employee> findByBranch(@PathVariable Long branchId) {
        return employeeService.findByBranch(branchId);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_UPDATE')")
    public Employee update(@PathVariable Long id, @RequestBody EmployeeRequest request) {
        return employeeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_DELETE')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        employeeService.delete(id);
    }

    @GetMapping("/import-template")
    @PreAuthorize("hasAuthority('EMPLOYEE_CREATE')")
    public ResponseEntity<byte[]> downloadTemplate() throws Exception {
        byte[] bytes = employeeService.generateTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=employees_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @PostMapping("/bulk-import")
    @PreAuthorize("hasAuthority('EMPLOYEE_CREATE')")
    public BulkImportResult bulkImport(@RequestParam("file") MultipartFile file) throws Exception {
        return employeeService.importFromExcel(file);
    }
}
