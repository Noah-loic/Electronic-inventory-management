package com.example.EUCL.repository;

import com.example.EUCL.entity.DeviceAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DeviceAssignmentRepository extends JpaRepository<DeviceAssignment, Long> {
    List<DeviceAssignment> findByDeviceIdOrderByAssignedAtDesc(Long deviceId);
    List<DeviceAssignment> findByEmployeeIdAndIsActiveTrue(Long employeeId);
    Optional<DeviceAssignment> findByDeviceIdAndIsActiveTrue(Long deviceId);
}
