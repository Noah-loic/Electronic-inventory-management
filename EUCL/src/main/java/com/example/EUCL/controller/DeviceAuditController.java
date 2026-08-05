package com.example.EUCL.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.EUCL.dto.DeviceAuditReport;
import com.example.EUCL.service.DeviceAuditService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/audit")
@RequiredArgsConstructor
public class DeviceAuditController {

    private final DeviceAuditService deviceAuditService;

    // year = fiscal year start, e.g. 2024 means July 2024 → June 2025
    @GetMapping("/devices")
    @PreAuthorize("hasAuthority('REPORT_READ')")
    public List<DeviceAuditReport> getAuditReport(@RequestParam Long branchId, @RequestParam int year) {
        return deviceAuditService.getAuditReport(branchId, year);
    }

    @GetMapping("/export")
    @PreAuthorize("hasAuthority('REPORT_READ')")
    public ResponseEntity<byte[]> exportExcel(@RequestParam Long branchId, @RequestParam int year) throws Exception {
        byte[] bytes = deviceAuditService.exportExcel(branchId, year);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=audit-report-" + year + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }
}
