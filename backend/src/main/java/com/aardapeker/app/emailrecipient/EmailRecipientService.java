package com.aardapeker.app.emailrecipient;

import com.aardapeker.app.exception.BadRequestException;
import com.aardapeker.app.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class EmailRecipientService {

    private final EmailRecipientRepository repository;

    public EmailRecipientService(EmailRecipientRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<EmailRecipient> getAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<EmailRecipient> getActive() {
        return repository.findByActiveTrue();
    }

    @Transactional
    public EmailRecipient create(EmailRecipientRequest request) {
        if (repository.existsByEmail(request.email())) {
            throw new BadRequestException("Bu e-posta adresi zaten kayıtlı: " + request.email());
        }
        EmailRecipient recipient = EmailRecipient.builder()
                .email(request.email().toLowerCase().trim())
                .label(request.label())
                .active(true)
                .build();
        return repository.save(recipient);
    }

    @Transactional
    public EmailRecipient toggleActive(UUID id) {
        EmailRecipient recipient = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("E-posta alıcısı bulunamadı: " + id));
        recipient.setActive(!recipient.isActive());
        return repository.save(recipient);
    }

    @Transactional
    public void delete(UUID id) {
        EmailRecipient recipient = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("E-posta alıcısı bulunamadı: " + id));
        repository.delete(recipient);
    }
}
