package com.example.EUCL.enums;

import java.util.EnumSet;
import java.util.Set;

public class RolePermissions {

    public static Set<Permission> getDefaultPermissions(UserRole role) {
        return switch (role) {
            case ADMIN -> EnumSet.allOf(Permission.class);

            case ICT_STAFF -> EnumSet.of(
                    Permission.DEVICE_CREATE, Permission.DEVICE_READ, Permission.DEVICE_UPDATE,
                    Permission.EMPLOYEE_READ,
                    Permission.BRANCH_READ,
                    Permission.DEPARTMENT_READ,
                    Permission.ASSIGNMENT_CREATE, Permission.ASSIGNMENT_READ,
                    Permission.REPAIR_REQUEST_READ, Permission.REPAIR_REQUEST_UPDATE,
                    Permission.REPORT_READ
            );

            case BRANCH_MANAGER -> EnumSet.of(
                    Permission.BRANCH_READ,
                    Permission.REPAIR_REQUEST_CREATE, Permission.REPAIR_REQUEST_READ,
                    Permission.REPORT_READ
            );
        };
    }
}
