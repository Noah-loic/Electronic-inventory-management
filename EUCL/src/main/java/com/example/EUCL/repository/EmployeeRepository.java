package com.example.EUCL.repository;

import com.example.EUCL.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByDepartmentId(Long departmentId);
    List<Employee> findByBranchId(Long branchId);
    java.util.Optional<Employee> findByEmployeeId(String employeeId);
}
