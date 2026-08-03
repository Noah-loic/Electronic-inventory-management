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

import com.example.EUCL.dto.BranchRequest;
import com.example.EUCL.entity.Branch;
import com.example.EUCL.service.BranchService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @PostMapping
    @PreAuthorize("hasAuthority('BRANCH_CREATE')")
    @ResponseStatus(HttpStatus.CREATED)
    public Branch create(@RequestBody BranchRequest request) {
        return branchService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('BRANCH_READ')")
    public List<Branch> findAll() {
        return branchService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('BRANCH_READ')")
    public Branch findById(@PathVariable Long id) {
        return branchService.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('BRANCH_UPDATE')")
    public Branch update(@PathVariable Long id, @RequestBody BranchRequest request) {
        return branchService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('BRANCH_DELETE')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        branchService.delete(id);
    }
}
