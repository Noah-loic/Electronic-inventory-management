package com.example.EUCL.service;

import com.example.EUCL.dto.DeviceRequest;
import com.example.EUCL.entity.Device;
import com.example.EUCL.enums.DeviceStatus;
import com.example.EUCL.repository.BranchRepository;
import com.example.EUCL.repository.DeviceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final BranchRepository branchRepository;

    public Device create(DeviceRequest request) {
        Device device = new Device();
        device.setTagNumber(request.getTagNumber());
        device.setModel(request.getModel());
        device.setSerialNumber(request.getSerialNumber());
        device.setDeviceType(request.getDeviceType());
        device.setStatus(request.getStatus() != null ? request.getStatus() : DeviceStatus.UNASSIGNED);
        device.setBranch(branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new EntityNotFoundException("Branch not found")));
        return deviceRepository.save(device);
    }

    public List<Device> findAll() {
        return deviceRepository.findAll();
    }

    public Device findById(Long id) {
        return deviceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Device not found with id: " + id));
    }

    public List<Device> findByStatus(DeviceStatus status) {
        return deviceRepository.findByStatus(status);
    }

    public List<Device> findByBranch(Long branchId) {
        return deviceRepository.findByBranchId(branchId);
    }

    public Device update(Long id, DeviceRequest request) {
        Device device = findById(id);
        device.setTagNumber(request.getTagNumber());
        device.setModel(request.getModel());
        device.setSerialNumber(request.getSerialNumber());
        device.setDeviceType(request.getDeviceType());
        if (request.getStatus() != null) device.setStatus(request.getStatus());
        if (request.getBranchId() != null) {
            device.setBranch(branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new EntityNotFoundException("Branch not found")));
        }
        return deviceRepository.save(device);
    }

    public void delete(Long id) {
        deviceRepository.delete(findById(id));
    }
}
