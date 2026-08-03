package com.example.EUCL.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.example.EUCL.dto.DepartmentRequest;
import com.example.EUCL.entity.Department;
import com.example.EUCL.service.DepartmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    @PreAuthorize("hasAuthority('DEPARTMENT_CREATE')")
    @ResponseStatus(HttpStatus.CREATED)
    public Department create(@RequestBody DepartmentRequest request) {
        return departmentService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('DEPARTMENT_READ')")
    public List<Department> findAll() {
        return departmentService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('DEPARTMENT_READ')")
    public Department findById(@PathVariable Long id) {
        return departmentService.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('DEPARTMENT_UPDATE')")
    public Department update(@PathVariable Long id, @RequestBody DepartmentRequest request) {
        return departmentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DEPARTMENT_DELETE')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        departmentService.delete(id);
    }
}
