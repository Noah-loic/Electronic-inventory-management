package com.example.EUCL.controller;

import com.example.EUCL.dto.DeviceAuditReport;
import com.example.EUCL.service.DeviceAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/audit")
@RequiredArgsConstructor
public class DeviceAuditController {

    private final DeviceAuditService deviceAuditService;

    // year = fiscal year start, e.g. 2024 means July 2024 → June 2025
    @GetMapping("/devices")
    public List<DeviceAuditReport> getAuditReport(@RequestParam Long branchId, @RequestParam int year) {
        return deviceAuditService.getAuditReport(branchId, year);
    }
}
