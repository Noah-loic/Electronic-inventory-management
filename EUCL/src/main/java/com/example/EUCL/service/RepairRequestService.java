package com.example.EUCL.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.EUCL.dto.RepairRequestDto;
import com.example.EUCL.dto.RepairStatusUpdateDto;
import com.example.EUCL.entity.AppUser;
import com.example.EUCL.entity.DeviceStatusHistory;
import com.example.EUCL.entity.RepairRequest;
import com.example.EUCL.enums.DeviceStatus;
import com.example.EUCL.enums.Permission;
import com.example.EUCL.enums.RepairStatus;
import com.example.EUCL.repository.AppUserRepository;
import com.example.EUCL.repository.DeviceAssignmentRepository;
import com.example.EUCL.repository.DeviceRepository;
import com.example.EUCL.repository.DeviceStatusHistoryRepository;
import com.example.EUCL.repository.RepairRequestRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RepairRequestService {

    private final RepairRequestRepository repairRequestRepository;
    private final DeviceRepository deviceRepository;
    private final AppUserRepository appUserRepository;
    private final DeviceAssignmentRepository assignmentRepository;
    private final DeviceStatusHistoryRepository statusHistoryRepository;

    @Transactional
    public RepairRequest submit(RepairRequestDto dto) {
        AppUser requestedBy = appUserRepository.findById(dto.getRequestedById())
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + dto.getRequestedById()));

        if (!requestedBy.getPermissions().contains(Permission.REPAIR_REQUEST_CREATE))
            throw new IllegalArgumentException("Only users with REPAIR_REQUEST_CREATE permission can submit repair requests");

        RepairRequest request = new RepairRequest();
        request.setDevice(deviceRepository.findById(dto.getDeviceId())
                .orElseThrow(() -> new EntityNotFoundException("Device not found with id: " + dto.getDeviceId())));
        request.setRequestedBy(requestedBy);
        request.setIssueDescription(dto.getIssueDescription());

        return repairRequestRepository.save(request);
    }

    @Transactional
    public RepairRequest updateStatus(Long requestId, RepairStatusUpdateDto dto) {
        RepairRequest request = repairRequestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Repair request not found with id: " + requestId));

        AppUser handledBy = appUserRepository.findById(dto.getHandledById())
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + dto.getHandledById()));

        if (!handledBy.getPermissions().contains(Permission.REPAIR_REQUEST_UPDATE))
            throw new IllegalArgumentException("Only users with REPAIR_REQUEST_UPDATE permission can update repair request status");

        RepairStatus newStatus = dto.getNewStatus();
        var device = request.getDevice();
        DeviceStatus oldDeviceStatus = device.getStatus();
        DeviceStatus newDeviceStatus = null;

        switch (newStatus) {
            case IN_PROGRESS -> {
                // device becomes IN_REPAIR, close active assignment
                newDeviceStatus = DeviceStatus.IN_REPAIR;
                assignmentRepository.findByDeviceIdAndIsActiveTrue(device.getId()).ifPresent(a -> {
                    a.setUnassignedAt(LocalDateTime.now());
                    a.setIsActive(false);
                    assignmentRepository.save(a);
                });
            }
            case REPAIRED -> {
                newDeviceStatus = DeviceStatus.UNASSIGNED;
                request.setResolvedAt(LocalDateTime.now());
            }
            case UNREPAIRABLE -> {
                newDeviceStatus = DeviceStatus.DECOMMISSIONED;
                request.setResolvedAt(LocalDateTime.now());
            }
            default -> throw new IllegalArgumentException("Invalid status transition: " + newStatus);
        }

        // record device status change in history
        DeviceStatusHistory history = new DeviceStatusHistory();
        history.setDevice(device);
        history.setOldStatus(oldDeviceStatus);
        history.setNewStatus(newDeviceStatus);
        history.setReason("Repair request #" + requestId + ": " + dto.getResolutionNote());
        history.setChangedBy(handledBy);
        statusHistoryRepository.save(history);

        device.setStatus(newDeviceStatus);
        deviceRepository.save(device);

        request.setStatus(newStatus);
        request.setHandledBy(handledBy);
        request.setResolutionNote(dto.getResolutionNote());

        return repairRequestRepository.save(request);
    }

    // ICT Staff and Admin — see all requests
    public List<RepairRequest> findAll() {
        return repairRequestRepository.findAll();
    }

    // Branch Manager — see only requests from their own branch
    public List<RepairRequest> findByBranch(Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        Long branchId = user.getEmployee().getBranch().getId();
        return repairRequestRepository.findByRequestedByEmployeeBranchId(branchId);
    }

    public List<RepairRequest> findByStatus(RepairStatus status) {
        return repairRequestRepository.findByStatus(status);
    }
}
