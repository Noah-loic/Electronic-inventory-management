package com.example.EUCL.controller;

import com.example.EUCL.dto.DeviceRequest;
import com.example.EUCL.entity.Device;
import com.example.EUCL.enums.DeviceStatus;
import com.example.EUCL.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Device create(@RequestBody DeviceRequest request) {
        return deviceService.create(request);
    }

    @GetMapping
    public List<Device> findAll() {
        return deviceService.findAll();
    }

    @GetMapping("/{id}")
    public Device findById(@PathVariable Long id) {
        return deviceService.findById(id);
    }

    @GetMapping("/status/{status}")
    public List<Device> findByStatus(@PathVariable DeviceStatus status) {
        return deviceService.findByStatus(status);
    }

    @GetMapping("/branch/{branchId}")
    public List<Device> findByBranch(@PathVariable Long branchId) {
        return deviceService.findByBranch(branchId);
    }

    @PutMapping("/{id}")
    public Device update(@PathVariable Long id, @RequestBody DeviceRequest request) {
        return deviceService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        deviceService.delete(id);
    }
}
