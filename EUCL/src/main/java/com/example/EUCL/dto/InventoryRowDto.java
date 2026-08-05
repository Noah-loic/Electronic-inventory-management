package com.example.EUCL.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class InventoryRowDto {
    // Device
    private Long deviceId;
    private String tagNumber;
    private String model;
    private String serialNumber;
    private String deviceType;
    private String currentStatus;
    private String branchName;       // registered/home branch
    private String currentBranchName; // physical location branch

    // Current assignment (null if unassigned)
    private String assignedEmployeeName;
    private String assignedEmployeeId;
    private LocalDateTime assignedAt;
    private String assignedByName;
    private String assignmentNote;

    // Inventory check state
    private Long inventoryCheckId;
    private boolean present;
    private boolean working;

    // Latest repair request (if any)
    private String repairRequestedBy;
    private String repairHandledBy;
    private String repairStatus;
}
