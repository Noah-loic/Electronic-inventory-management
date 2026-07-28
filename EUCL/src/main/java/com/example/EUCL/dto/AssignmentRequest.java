package com.example.EUCL.dto;

import lombok.Data;

@Data
public class AssignmentRequest {
    private Long deviceId;
    private Long employeeId;
    private Long assignedById;
    private Long branchId;
    private String note;
}
