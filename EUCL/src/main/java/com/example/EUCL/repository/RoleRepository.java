package com.example.EUCL.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.EUCL.entity.Role;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByNameIgnoreCase(String name);
}
