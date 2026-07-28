package com.example.EUCL.controller;

import com.example.EUCL.dto.BranchRequest;
import com.example.EUCL.entity.Branch;
import com.example.EUCL.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Branch create(@RequestBody BranchRequest request) {
        return branchService.create(request);
    }

    @GetMapping
    public List<Branch> findAll() {
        return branchService.findAll();
    }

    @GetMapping("/{id}")
    public Branch findById(@PathVariable Long id) {
        return branchService.findById(id);
    }

    @PutMapping("/{id}")
    public Branch update(@PathVariable Long id, @RequestBody BranchRequest request) {
        return branchService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        branchService.delete(id);
    }
}
