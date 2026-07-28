package com.example.EUCL.service;

import com.example.EUCL.dto.EmployeeRequest;
import com.example.EUCL.entity.Employee;
import com.example.EUCL.repository.BranchRepository;
import com.example.EUCL.repository.DepartmentRepository;
import com.example.EUCL.repository.EmployeeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

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
}
