package com.example.EUCL.dto;

import com.example.EUCL.entity.DeviceAssignment;
import com.example.EUCL.entity.DeviceStatusHistory;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class DeviceAuditReport {

    private Long deviceId;
    private String tagNumber;
    private String model;
    private String serialNumber;
    private String deviceType;
    private String currentStatus;
    private String branch;
    private List<DeviceAssignment> assignmentHistory;
    private List<DeviceStatusHistory> statusHistory;

    // Inventory check for this fiscal year
    private Boolean inventoryPresent;
    private Boolean inventoryWorking;
    private boolean inventoryChecked;
}