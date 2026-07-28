package com.example.EUCL.repository;

import com.example.EUCL.entity.RepairRequest;
import com.example.EUCL.enums.RepairStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RepairRequestRepository extends JpaRepository<RepairRequest, Long> {
    List<RepairRequest> findAll();
    List<RepairRequest> findByDeviceBranchId(Long branchId);
    List<RepairRequest> findByStatus(RepairStatus status);
}
