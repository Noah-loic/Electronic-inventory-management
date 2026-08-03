package com.example.EUCL.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.EUCL.dto.AssignmentRequest;
import com.example.EUCL.entity.DeviceAssignment;
import com.example.EUCL.service.DeviceAssignmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/assignments")
@RequiredArgsConstructor
public class DeviceAssignmentController {

    private final DeviceAssignmentService assignmentService;

    @GetMapping
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public List<DeviceAssignment> findAll() {
        return assignmentService.findAll();
    }

    @PostMapping("/assign")
    @PreAuthorize("hasAuthority('ASSIGNMENT_CREATE')")
    public DeviceAssignment assign(@RequestBody AssignmentRequest request) {
        return assignmentService.assign(request);
    }

    @PutMapping("/{id}/unassign")
    // TODO: no ASSIGNMENT_UPDATE permission exists; using ASSIGNMENT_CREATE for now
    @PreAuthorize("hasAuthority('ASSIGNMENT_CREATE')")
    public DeviceAssignment unassign(@PathVariable Long id, @RequestParam(required = false) String note) {
        return assignmentService.unassign(id, note);
    }

    @GetMapping("/device/{deviceId}/history")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public List<DeviceAssignment> getHistory(@PathVariable Long deviceId) {
        return assignmentService.getHistory(deviceId);
    }

    @GetMapping("/employee/{employeeId}/active")
    @PreAuthorize("hasAuthority('ASSIGNMENT_READ')")
    public List<DeviceAssignment> getActiveByEmployee(@PathVariable Long employeeId) {
        return assignmentService.getActiveByEmployee(employeeId);
    }
}
