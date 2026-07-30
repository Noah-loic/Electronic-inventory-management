package com.example.EUCL.service;

import com.example.EUCL.dto.AssignmentRequest;
import com.example.EUCL.entity.Device;
import com.example.EUCL.entity.DeviceAssignment;
import com.example.EUCL.enums.DeviceStatus;
import com.example.EUCL.repository.AppUserRepository;
import com.example.EUCL.repository.BranchRepository;
import com.example.EUCL.repository.DeviceAssignmentRepository;
import com.example.EUCL.repository.DeviceRepository;
import com.example.EUCL.repository.EmployeeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeviceAssignmentService {

    private final DeviceAssignmentRepository assignmentRepository;
    private final DeviceRepository deviceRepository;
    private final EmployeeRepository employeeRepository;
    private final AppUserRepository appUserRepository;
    private final BranchRepository branchRepository;

    @Transactional
    public DeviceAssignment assign(AssignmentRequest request) {
        Device device = deviceRepository.findById(request.getDeviceId())
                .orElseThrow(() -> new EntityNotFoundException("Device not found"));

        if (device.getStatus() == DeviceStatus.IN_REPAIR || device.getStatus() == DeviceStatus.DECOMMISSIONED)
            throw new IllegalStateException("Device is not available for assignment");

        if (assignmentRepository.findByDeviceIdAndIsActiveTrue(device.getId()).isPresent())
            throw new IllegalStateException("Device already has an active assignment");

        var employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        DeviceAssignment assignment = new DeviceAssignment();
        assignment.setDevice(device);
        assignment.setEmployee(employee);
        assignment.setAssignedBy(appUserRepository.findById(request.getAssignedById())
                .orElseThrow(() -> new EntityNotFoundException("User not found")));
        assignment.setBranch(branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new EntityNotFoundException("Branch not found")));
        assignment.setNote(request.getNote());

        device.setStatus(DeviceStatus.ACTIVE);
        device.setBranch(employee.getBranch());
        deviceRepository.save(device);

        return assignmentRepository.save(assignment);
    }

    @Transactional
    public DeviceAssignment unassign(Long assignmentId, String note) {
        DeviceAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found"));

        if (!assignment.getIsActive())
            throw new IllegalStateException("Assignment is already inactive");

        assignment.setIsActive(false);
        assignment.setUnassignedAt(LocalDateTime.now());
        if (note != null) assignment.setNote(note);

        Device device = assignment.getDevice();
        device.setStatus(DeviceStatus.UNASSIGNED);
        branchRepository.findFirstByNameContainingIgnoreCase("HQ")
                .ifPresent(device::setBranch);
        deviceRepository.save(device);

        return assignmentRepository.save(assignment);
    }

    public List<DeviceAssignment> getHistory(Long deviceId) {
        return assignmentRepository.findByDeviceIdOrderByAssignedAtDesc(deviceId);
    }

    public List<DeviceAssignment> getActiveByEmployee(Long employeeId) {
        return assignmentRepository.findByEmployeeIdAndIsActiveTrue(employeeId);
    }

    public List<DeviceAssignment> findAll() {
        return assignmentRepository.findAll();
    }
}
