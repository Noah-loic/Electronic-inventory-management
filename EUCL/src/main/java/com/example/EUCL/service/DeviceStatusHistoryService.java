package com.example.EUCL.service;

import com.example.EUCL.dto.DeviceStatusRequest;
import com.example.EUCL.entity.Device;
import com.example.EUCL.entity.DeviceAssignment;
import com.example.EUCL.entity.DeviceStatusHistory;
import com.example.EUCL.enums.DeviceStatus;
import com.example.EUCL.repository.AppUserRepository;
import com.example.EUCL.repository.DeviceAssignmentRepository;
import com.example.EUCL.repository.DeviceRepository;
import com.example.EUCL.repository.DeviceStatusHistoryRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeviceStatusHistoryService {

    private final DeviceRepository deviceRepository;
    private final DeviceStatusHistoryRepository historyRepository;
    private final DeviceAssignmentRepository assignmentRepository;
    private final AppUserRepository appUserRepository;

    @Transactional
    public DeviceStatusHistory changeStatus(Long deviceId, DeviceStatusRequest request) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new EntityNotFoundException("Device not found with id: " + deviceId));

        if (device.getStatus() == request.getNewStatus())
            throw new IllegalArgumentException("Device is already in status: " + request.getNewStatus());

        // auto-unassign if moving to IN_REPAIR or DECOMMISSIONED
        if (request.getNewStatus() == DeviceStatus.IN_REPAIR || request.getNewStatus() == DeviceStatus.DECOMMISSIONED) {
            assignmentRepository.findByDeviceIdAndIsActiveTrue(deviceId).ifPresent(assignment -> {
                assignment.setUnassignedAt(LocalDateTime.now());
                assignment.setIsActive(false);
                assignmentRepository.save(assignment);
            });
        }

        DeviceStatusHistory history = new DeviceStatusHistory();
        history.setDevice(device);
        history.setOldStatus(device.getStatus());
        history.setNewStatus(request.getNewStatus());
        history.setReason(request.getReason());
        history.setChangedBy(appUserRepository.findById(request.getChangedById())
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + request.getChangedById())));

        device.setStatus(request.getNewStatus());
        deviceRepository.save(device);

        return historyRepository.save(history);
    }

    public List<DeviceStatusHistory> getHistory(Long deviceId) {
        return historyRepository.findByDeviceIdOrderByChangedAtDesc(deviceId);
    }
}
