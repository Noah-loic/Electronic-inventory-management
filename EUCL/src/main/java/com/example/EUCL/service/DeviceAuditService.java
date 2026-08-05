package com.example.EUCL.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.EUCL.dto.DeviceAuditReport;
import com.example.EUCL.entity.Device;
import com.example.EUCL.entity.InventoryCheck;
import com.example.EUCL.repository.DeviceAssignmentRepository;
import com.example.EUCL.repository.DeviceRepository;
import com.example.EUCL.repository.DeviceStatusHistoryRepository;
import com.example.EUCL.repository.InventoryCheckRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeviceAuditService {

    private final DeviceRepository deviceRepository;
    private final DeviceAssignmentRepository assignmentRepository;
    private final DeviceStatusHistoryRepository statusHistoryRepository;
    private final InventoryCheckRepository inventoryCheckRepository;

    // fiscalYear = the year the fiscal year starts, e.g. 2024 means July 2024 → June 2025
    public List<DeviceAuditReport> getAuditReport(Long branchId, int fiscalYear) {
        LocalDateTime from = LocalDateTime.of(fiscalYear, 7, 1, 0, 0);
        LocalDateTime to = LocalDateTime.of(fiscalYear + 1, 6, 30, 23, 59, 59);

        List<Device> devices = deviceRepository.findByBranchId(branchId);
        if (devices.isEmpty())
            throw new EntityNotFoundException("No devices found for branch id: " + branchId);

        return devices.stream().map(device -> {
            InventoryCheck check = inventoryCheckRepository
                    .findByDeviceIdAndFiscalYear(device.getId(), fiscalYear).orElse(null);
            return new DeviceAuditReport(
                    device.getId(),
                    device.getTagNumber(),
                    device.getModel(),
                    device.getSerialNumber(),
                    device.getDeviceType(),
                    device.getStatus().name(),
                    device.getBranch().getName(),
                    assignmentRepository.findByBranchIdAndAssignedAtBetween(branchId, from, to)
                            .stream().filter(a -> a.getDevice().getId().equals(device.getId())).toList(),
                    statusHistoryRepository.findByDeviceIdAndChangedAtBetween(device.getId(), from, to),
                    check != null ? check.isPresent() : null,
                    check != null ? check.isWorking() : null,
                    check != null
            );
        }).toList();
    }
}
