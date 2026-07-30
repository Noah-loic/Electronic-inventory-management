package com.example.EUCL.service;

import com.example.EUCL.dto.AppUserRequest;
import com.example.EUCL.dto.PermissionUpdateRequest;
import com.example.EUCL.entity.AppUser;
import com.example.EUCL.enums.Permission;
import com.example.EUCL.enums.RolePermissions;
import com.example.EUCL.repository.AppUserRepository;
import com.example.EUCL.repository.EmployeeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AppUserService {

    private final AppUserRepository appUserRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public AppUser create(AppUserRequest request) {
        AppUser user = new AppUser();
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword());
        user.setRole(request.getRole());
        user.setEmployee(employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + request.getEmployeeId())));
        // assign default permissions based on role
        user.setPermissions(RolePermissions.getDefaultPermissions(request.getRole()));
        return appUserRepository.save(user);
    }

    public List<AppUser> findAll() {
        return appUserRepository.findAll();
    }

    public AppUser findById(Long id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
    }

    @Transactional
    public AppUser update(Long id, AppUserRequest request) {
        AppUser user = findById(id);
        user.setUsername(request.getUsername());
        if (request.getPassword() != null) user.setPassword(request.getPassword());
        user.setRole(request.getRole());
        user.setEmployee(employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + request.getEmployeeId())));
        return appUserRepository.save(user);
    }

    public void delete(Long id) {
        appUserRepository.delete(findById(id));
    }

    // replace all permissions for a user
    @Transactional
    public AppUser setPermissions(Long id, PermissionUpdateRequest request) {
        AppUser user = findById(id);
        user.setPermissions(request.getPermissions());
        return appUserRepository.save(user);
    }

    // grant additional permissions without removing existing ones
    @Transactional
    public AppUser grantPermissions(Long id, PermissionUpdateRequest request) {
        AppUser user = findById(id);
        user.getPermissions().addAll(request.getPermissions());
        return appUserRepository.save(user);
    }

    // revoke specific permissions
    @Transactional
    public AppUser revokePermissions(Long id, PermissionUpdateRequest request) {
        AppUser user = findById(id);
        user.getPermissions().removeAll(request.getPermissions());
        return appUserRepository.save(user);
    }

    // reset permissions back to role defaults
    @Transactional
    public AppUser resetToRoleDefaults(Long id) {
        AppUser user = findById(id);
        user.setPermissions(RolePermissions.getDefaultPermissions(user.getRole()));
        return appUserRepository.save(user);
    }

    public Set<Permission> getPermissions(Long id) {
        return findById(id).getPermissions();
    }
}
