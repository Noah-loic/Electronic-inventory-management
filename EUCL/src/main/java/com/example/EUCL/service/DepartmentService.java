package com.example.EUCL.service;

import com.example.EUCL.dto.DepartmentRequest;
import com.example.EUCL.entity.Department;
import com.example.EUCL.repository.DepartmentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public Department create(DepartmentRequest request) {
        Department department = new Department();
        department.setName(request.getName());
        return departmentRepository.save(department);
    }

    public List<Department> findAll() {
        return departmentRepository.findAll();
    }

    public Department findById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + id));
    }

    public Department update(Long id, DepartmentRequest request) {
        Department department = findById(id);
        department.setName(request.getName());
        return departmentRepository.save(department);
    }

    public void delete(Long id) {
        departmentRepository.delete(findById(id));
    }
}
