package com.example.EUCL.controller;

import com.example.EUCL.dto.AssignmentRequest;
import com.example.EUCL.entity.DeviceAssignment;
import com.example.EUCL.service.DeviceAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/assignments")
@RequiredArgsConstructor
public class DeviceAssignmentController {

    private final DeviceAssignmentService assignmentService;

    @GetMapping
    public List<DeviceAssignment> findAll() {
        return assignmentService.findAll();
    }

    @PostMapping("/assign")
    public DeviceAssignment assign(@RequestBody AssignmentRequest request) {
        return assignmentService.assign(request);
    }

    @PutMapping("/{id}/unassign")
    public DeviceAssignment unassign(@PathVariable Long id, @RequestParam(required = false) String note) {
        return assignmentService.unassign(id, note);
    }

    @GetMapping("/device/{deviceId}/history")
    public List<DeviceAssignment> getHistory(@PathVariable Long deviceId) {
        return assignmentService.getHistory(deviceId);
    }

    @GetMapping("/employee/{employeeId}/active")
    public List<DeviceAssignment> getActiveByEmployee(@PathVariable Long employeeId) {
        return assignmentService.getActiveByEmployee(employeeId);
    }
}
