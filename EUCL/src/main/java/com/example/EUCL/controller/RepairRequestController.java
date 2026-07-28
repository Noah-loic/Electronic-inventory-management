package com.example.EUCL.controller;

import com.example.EUCL.dto.RepairRequestDto;
import com.example.EUCL.dto.RepairStatusUpdateDto;
import com.example.EUCL.entity.RepairRequest;
import com.example.EUCL.enums.RepairStatus;
import com.example.EUCL.service.RepairRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/repair-requests")
@RequiredArgsConstructor
public class RepairRequestController {

    private final RepairRequestService repairRequestService;

    // Branch Manager / Admin submits a repair request
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RepairRequest submit(@RequestBody RepairRequestDto dto) {
        return repairRequestService.submit(dto);
    }

    // ICT Staff / Admin updates repair request status
    @PutMapping("/{id}/status")
    public RepairRequest updateStatus(@PathVariable Long id, @RequestBody RepairStatusUpdateDto dto) {
        return repairRequestService.updateStatus(id, dto);
    }

    // ICT Staff / Admin — all requests
    @GetMapping
    public List<RepairRequest> findAll() {
        return repairRequestService.findAll();
    }

    // Branch Manager — own branch requests only (pass their userId)
    @GetMapping("/branch")
    public List<RepairRequest> findByBranch(@RequestParam Long userId) {
        return repairRequestService.findByBranch(userId);
    }

    // Filter by repair status
    @GetMapping("/status/{status}")
    public List<RepairRequest> findByStatus(@PathVariable RepairStatus status) {
        return repairRequestService.findByStatus(status);
    }
}
