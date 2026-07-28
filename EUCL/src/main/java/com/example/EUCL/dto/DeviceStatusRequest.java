package com.example.EUCL.dto;

import com.example.EUCL.enums.DeviceStatus;
import lombok.Data;

@Data
public class DeviceStatusRequest {
    private DeviceStatus newStatus;
    private String reason;
    private Long changedById;
}
