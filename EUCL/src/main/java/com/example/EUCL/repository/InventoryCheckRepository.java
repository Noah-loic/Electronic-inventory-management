package com.example.EUCL.repository;

import com.example.EUCL.entity.InventoryCheck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventoryCheckRepository extends JpaRepository<InventoryCheck, Long> {
    Optional<InventoryCheck> findByDeviceIdAndFiscalYear(Long deviceId, int fiscalYear);
    List<InventoryCheck> findByDevice_BranchIdAndFiscalYear(Long branchId, int fiscalYear);
}
