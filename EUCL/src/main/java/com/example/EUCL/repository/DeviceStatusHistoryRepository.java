package com.example.EUCL.repository;

import com.example.EUCL.entity.DeviceStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface DeviceStatusHistoryRepository extends JpaRepository<DeviceStatusHistory, Long> {
    List<DeviceStatusHistory> findByDeviceIdOrderByChangedAtDesc(Long deviceId);
    List<DeviceStatusHistory> findByDeviceIdAndChangedAtBetween(Long deviceId, LocalDateTime from, LocalDateTime to);
}
