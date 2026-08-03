package com.example.EUCL.controller;

import com.example.EUCL.dto.BulkImportResult;
import com.example.EUCL.dto.DeviceRequest;
import com.example.EUCL.entity.Device;
import com.example.EUCL.enums.DeviceStatus;
import com.example.EUCL.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    @PostMapping
    @PreAuthorize("hasAuthority('DEVICE_CREATE')")
    @ResponseStatus(HttpStatus.CREATED)
    public Device create(@RequestBody DeviceRequest request) {
        return deviceService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public List<Device> findAll() {
        return deviceService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public Device findById(@PathVariable Long id) {
        return deviceService.findById(id);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public List<Device> findByStatus(@PathVariable DeviceStatus status) {
        return deviceService.findByStatus(status);
    }

    @GetMapping("/branch/{branchId}")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public List<Device> findByBranch(@PathVariable Long branchId) {
        return deviceService.findByBranch(branchId);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('DEVICE_UPDATE')")
    public Device update(@PathVariable Long id, @RequestBody DeviceRequest request) {
        return deviceService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DEVICE_DELETE')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        deviceService.delete(id);
    }

    @GetMapping("/import-template")
    @PreAuthorize("hasAuthority('DEVICE_CREATE')")
    public ResponseEntity<byte[]> downloadTemplate() throws Exception {
        byte[] bytes = deviceService.generateTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=devices_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @PostMapping("/bulk-import")
    @PreAuthorize("hasAuthority('DEVICE_CREATE')")
    public BulkImportResult bulkImport(@RequestParam("file") MultipartFile file) throws Exception {
        return deviceService.importFromExcel(file);
    }
}
