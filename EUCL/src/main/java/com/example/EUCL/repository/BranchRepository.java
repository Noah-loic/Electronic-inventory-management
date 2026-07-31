package com.example.EUCL.repository;

import com.example.EUCL.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BranchRepository extends JpaRepository<Branch, Long> {
    java.util.Optional<Branch> findFirstByNameContainingIgnoreCase(String name);
    java.util.Optional<Branch> findByNameIgnoreCase(String name);
}
