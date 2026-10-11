package com.aardapeker.app.serviceform;

import com.aardapeker.app.emailrecipient.EmailRecipientRepository;
import com.aardapeker.app.exception.ResourceNotFoundException;
import com.aardapeker.app.model.User;
import com.aardapeker.app.service.EmailService;
import jakarta.mail.MessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ServiceFormServiceImpl implements ServiceFormService {

    private static final Logger log = LoggerFactory.getLogger(ServiceFormServiceImpl.class);

    private final ServiceFormRepository repository;
    private final EmailService emailService;
    private final EmailRecipientRepository emailRecipientRepository;

    public ServiceFormServiceImpl(
            ServiceFormRepository repository,
            EmailService emailService,
            EmailRecipientRepository emailRecipientRepository) {
        this.repository = repository;
        this.emailService = emailService;
        this.emailRecipientRepository = emailRecipientRepository;
    }

    @Override
    @Transactional
    public ServiceForm submit(SubmitServiceFormRequest request, User technician) {
        ServiceForm form = ServiceForm.builder()
                .customerName(request.customerName())
                .contactPerson(request.contactPerson())
                .phone(request.phone())
                .email(request.email())
                .address(request.address())
                .serviceDate(request.serviceDate())
                .arrivalTime(request.arrivalTime())
                .deliveryTime(request.deliveryTime())
                .notification(request.notification())
                .staffCount(request.staffCount())
                .serviceLocation(request.serviceLocation())
                .serviceStatus(request.serviceStatus())
                .faultDescription(request.faultDescription())
                .serviceDescription(request.serviceDescription())
                .deliveryNotes(request.deliveryNotes())
                .customerSignature(request.customerSignature())
                .technicianSignature(request.technicianSignature())
                .syncStatus(FormSyncStatus.SYNCED)
                .technician(technician)
                .build();

        List<ServiceFormProduct> products = new ArrayList<>();
        if (request.products() != null) {
            for (SubmitServiceFormRequest.ProductDto dto : request.products()) {
                ServiceFormProduct product = ServiceFormProduct.builder()
                        .serviceForm(form)
                        .productName(dto.productName())
                        .quantity(dto.quantity())
                        .build();

                List<ServiceFormProductFieldValue> fieldValues = new ArrayList<>();
                if (dto.fieldValues() != null) {
                    for (SubmitServiceFormRequest.FieldValueDto fieldDto : dto.fieldValues()) {
                        fieldValues.add(ServiceFormProductFieldValue.builder()
                                .product(product)
                                .label(fieldDto.label())
                                .fieldType(fieldDto.fieldType())
                                .value(fieldDto.value())
                                .build());
                    }
                }
                product.setFieldValues(fieldValues);

                products.add(product);
            }
        }
        form.setProducts(products);

        ServiceForm saved = repository.save(form);
        sendEmails(saved, technician);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceForm getById(UUID id) {
        return repository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service form not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceForm> getAll() {
        return repository.findAllWithDetails();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceForm> getByTechnician(String username) {
        return repository.findByTechnicianUsername(username);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        ServiceForm form = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service form not found: " + id));
        repository.delete(form);
    }

    private void sendEmails(ServiceForm form, User technician) {
        String techName = technician.getUsername();
        String subject = "Servis Formu - " + form.getCustomerName();
        String html = ServiceFormEmailTemplate.render(form, techName);

        // Send to customer if they provided an email
        if (form.getEmail() != null && !form.getEmail().isBlank()) {
            trySend(form.getEmail(), subject, html);
        }

        // Send to all active recipients from DB
        emailRecipientRepository.findByActiveTrue().forEach(r ->
                trySend(r.getEmail(), subject, html)
        );
    }

    private void trySend(String to, String subject, String html) {
        try {
            emailService.sendVerificationEmail(to, subject, html);
        } catch (MessagingException | MailException e) {
            log.warn("Failed to send service form email to {}: {}", to, e.getMessage());
        }
    }
}
