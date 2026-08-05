package com.example.EUCL.dto;

import lombok.Data;

@Data
public class InventoryCheckRequest {
    private Long deviceId;
    private int fiscalYear;
    private boolean present;
    private boolean working;
}
