package com.example.EUCL.dto;

import lombok.Data;

@Data
public class RepairRequestDto {
    private Long deviceId;
    private Long requestedById;
    private String issueDescription;
}
