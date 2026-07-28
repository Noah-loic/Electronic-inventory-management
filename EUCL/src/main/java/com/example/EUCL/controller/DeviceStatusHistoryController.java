package com.example.EUCL.controller;

import com.example.EUCL.dto.DeviceStatusRequest;
import com.example.EUCL.entity.DeviceStatusHistory;
import com.example.EUCL.service.DeviceStatusHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/devices")
@RequiredArgsConstructor
public class DeviceStatusHistoryController {

    private final DeviceStatusHistoryService deviceStatusHistoryService;

    @PutMapping("/{id}/status")
    public DeviceStatusHistory changeStatus(@PathVariable Long id, @RequestBody DeviceStatusRequest request) {
        return deviceStatusHistoryService.changeStatus(id, request);
    }

    @GetMapping("/{id}/status-history")
    public List<DeviceStatusHistory> getHistory(@PathVariable Long id) {
        return deviceStatusHistoryService.getHistory(id);
    }
}
