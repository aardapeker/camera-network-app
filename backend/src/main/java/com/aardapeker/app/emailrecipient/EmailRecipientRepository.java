package com.aardapeker.app.emailrecipient;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EmailRecipientRepository extends JpaRepository<EmailRecipient, UUID> {

    List<EmailRecipient> findAllByOrderByCreatedAtDesc();

    List<EmailRecipient> findByActiveTrue();

    boolean existsByEmail(String email);
}
