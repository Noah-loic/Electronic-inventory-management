package com.example.EUCL.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.EUCL.dto.RepairRequestDto;
import com.example.EUCL.dto.RepairStatusUpdateDto;
import com.example.EUCL.entity.RepairRequest;
import com.example.EUCL.enums.RepairStatus;
import com.example.EUCL.service.RepairRequestService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/repair-requests")
@RequiredArgsConstructor
public class RepairRequestController {

    private final RepairRequestService repairRequestService;

    // Branch Manager / Admin submits a repair request
    @PostMapping
    @PreAuthorize("hasAuthority('REPAIR_REQUEST_CREATE')")
    @ResponseStatus(HttpStatus.CREATED)
    public RepairRequest submit(@RequestBody RepairRequestDto dto) {
        return repairRequestService.submit(dto);
    }

    // ICT Staff / Admin updates repair request status
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('REPAIR_REQUEST_UPDATE')")
    public RepairRequest updateStatus(@PathVariable Long id, @RequestBody RepairStatusUpdateDto dto) {
        return repairRequestService.updateStatus(id, dto);
    }

    // ICT Staff / Admin — all requests
    @GetMapping
    @PreAuthorize("hasAuthority('REPAIR_REQUEST_READ')")
    public List<RepairRequest> findAll() {
        return repairRequestService.findAll();
    }

    // Branch Manager — own branch requests only (pass their userId)
    @GetMapping("/branch")
    @PreAuthorize("hasAuthority('REPAIR_REQUEST_READ')")
    public List<RepairRequest> findByBranch(@RequestParam Long userId) {
        return repairRequestService.findByBranch(userId);
    }

    // Filter by repair status
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAuthority('REPAIR_REQUEST_READ')")
    public List<RepairRequest> findByStatus(@PathVariable RepairStatus status) {
        return repairRequestService.findByStatus(status);
    }
}
