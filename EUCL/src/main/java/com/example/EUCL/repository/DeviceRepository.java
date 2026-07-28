package com.example.EUCL.repository;

import com.example.EUCL.entity.Device;
import com.example.EUCL.enums.DeviceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeviceRepository extends JpaRepository<Device, Long> {
    List<Device> findByStatus(DeviceStatus status);
    List<Device> findByBranchId(Long branchId);

    List<Device> findByBranchName(String branchName);
}
