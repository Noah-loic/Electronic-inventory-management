package com.example.EUCL.config;

import com.example.EUCL.entity.AppUser;
import com.example.EUCL.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AuditorAwareImpl implements AuditorAware<AppUser> {

    private final AppUserRepository appUserRepository;

    @Override
    public Optional<AppUser> getCurrentAuditor() {
        Long userId = CurrentUserContext.getUserId();
        if (userId == null) return Optional.empty();
        return appUserRepository.findById(userId);
    }
}
