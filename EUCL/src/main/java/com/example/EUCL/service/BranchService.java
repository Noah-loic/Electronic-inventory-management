package com.example.EUCL.service;

import com.example.EUCL.dto.BranchRequest;
import com.example.EUCL.entity.Branch;
import com.example.EUCL.repository.BranchRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;

    public Branch create(BranchRequest request) {
        Branch branch = new Branch();
        branch.setName(request.getName());
        branch.setAddress(request.getAddress());
        return branchRepository.save(branch);
    }

    public List<Branch> findAll() {
        return branchRepository.findAll();
    }

    public Branch findById(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found with id: " + id));
    }

    public Branch update(Long id, BranchRequest request) {
        Branch branch = findById(id);
        branch.setName(request.getName());
        branch.setAddress(request.getAddress());
        return branchRepository.save(branch);
    }

    public void delete(Long id) {
        branchRepository.delete(findById(id));
    }
}
