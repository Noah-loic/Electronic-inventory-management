package com.example.EUCL.config;

import java.util.EnumSet;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.example.EUCL.entity.Role;
import com.example.EUCL.enums.Permission;
import com.example.EUCL.repository.RoleRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RoleSeeder {

    private final RoleRepository roleRepository;

    @PostConstruct
    public void seedRoles() {
        createSystemRole("ADMIN", "System administrator with full permissions", EnumSet.allOf(Permission.class));
        createSystemRole("ICT_STAFF", "ICT staff role with device, assignment, repair request, and report permissions",
                EnumSet.of(
                        Permission.DEVICE_CREATE, Permission.DEVICE_READ, Permission.DEVICE_UPDATE, Permission.DEVICE_DELETE,
                        Permission.EMPLOYEE_READ,
                        Permission.BRANCH_READ,
                        Permission.DEPARTMENT_READ,
                        Permission.ASSIGNMENT_CREATE, Permission.ASSIGNMENT_READ,
                        Permission.REPAIR_REQUEST_READ, Permission.REPAIR_REQUEST_UPDATE,
                        Permission.REPORT_READ,
                        Permission.USER_READ
                ));
        createSystemRole("BRANCH_MANAGER", "Branch manager role with branch and repair request permissions",
                EnumSet.of(
                        Permission.BRANCH_READ,
                        Permission.REPAIR_REQUEST_CREATE, Permission.REPAIR_REQUEST_READ,
                        Permission.REPORT_READ,
                        Permission.USER_READ
                ));
    }

    private void createSystemRole(String name, String description, Set<Permission> permissions) {
        roleRepository.findByNameIgnoreCase(name).orElseGet(() -> {
            Role role = new Role();
            role.setName(name);
            role.setDescription(description);
            role.setSystem(true);
            role.setPermissions(permissions);
            return roleRepository.save(role);
        });
    }
}
