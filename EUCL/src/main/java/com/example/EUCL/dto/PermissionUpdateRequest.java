package com.example.EUCL.dto;

import com.example.EUCL.enums.Permission;
import lombok.Data;

import java.util.Set;

@Data
public class PermissionUpdateRequest {
    private Set<Permission> permissions;
}
