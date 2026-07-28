package com.example.EUCL.dto;

import lombok.Data;

@Data
public class EmployeeRequest {
    private String employeeId;
    private String name;
    private Long departmentId;
    private Long branchId;
}
