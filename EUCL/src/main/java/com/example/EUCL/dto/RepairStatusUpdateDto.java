package com.example.EUCL.dto;

import com.example.EUCL.enums.RepairStatus;
import lombok.Data;

@Data
public class RepairStatusUpdateDto {
    private RepairStatus newStatus;
    private Long handledById;
    private String resolutionNote;
}
