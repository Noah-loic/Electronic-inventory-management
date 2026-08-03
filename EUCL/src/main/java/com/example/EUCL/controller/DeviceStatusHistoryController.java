package com.example.EUCL.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.EUCL.dto.DeviceStatusRequest;
import com.example.EUCL.entity.DeviceStatusHistory;
import com.example.EUCL.service.DeviceStatusHistoryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/devices")
@RequiredArgsConstructor
public class DeviceStatusHistoryController {

    private final DeviceStatusHistoryService deviceStatusHistoryService;

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('DEVICE_UPDATE')")
    public DeviceStatusHistory changeStatus(@PathVariable Long id, @RequestBody DeviceStatusRequest request) {
        return deviceStatusHistoryService.changeStatus(id, request);
    }

    @GetMapping("/{id}/status-history")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public List<DeviceStatusHistory> getHistory(@PathVariable Long id) {
        return deviceStatusHistoryService.getHistory(id);
    }
}
