package com.example.EUCL.dto;

import com.example.EUCL.enums.Permission;
import lombok.Data;

import java.util.List;

@Data
public class AppUserRequest {
    private String username;
    private String password;
    private List<Long> roleIds;
    private Long employeeId;
}
