package com.example.EUCL.dto;

import com.example.EUCL.enums.DeviceStatus;
import lombok.Data;

@Data
public class DeviceRequest {
    private String tagNumber;
    private String model;
    private String serialNumber;
    private String deviceType;
    private DeviceStatus status;
    private Long branchId;
}
