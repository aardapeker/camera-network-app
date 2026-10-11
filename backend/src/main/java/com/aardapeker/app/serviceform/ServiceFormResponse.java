package com.aardapeker.app.serviceform;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record ServiceFormResponse(
        UUID id,
        String customerName,
        String contactPerson,
        String phone,
        String email,
        String address,
        LocalDate serviceDate,
        LocalTime arrivalTime,
        LocalTime deliveryTime,
        String notification,
        Integer staffCount,
        ServiceLocation serviceLocation,
        ServiceFormStatus serviceStatus,
        String faultDescription,
        String serviceDescription,
        String deliveryNotes,
        String customerSignature,
        String technicianSignature,
        FormSyncStatus syncStatus,
        List<ProductDto> products,
        String technicianUsername,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public record ProductDto(
            UUID id, String productName, int quantity,
            List<FieldValueDto> fieldValues
    ) {}

    public record FieldValueDto(String label, String fieldType, String value) {}

    public static ServiceFormResponse from(ServiceForm f) {
        List<ProductDto> products = f.getProducts() == null ? List.of() :
                f.getProducts().stream()
                        .map(p -> new ProductDto(
                                p.getId(), p.getProductName(), p.getQuantity(),
                                p.getFieldValues().stream()
                                        .map(fv -> new FieldValueDto(fv.getLabel(), fv.getFieldType().name(), fv.getValue()))
                                        .toList()
                        ))
                        .toList();

        return new ServiceFormResponse(
                f.getId(), f.getCustomerName(), f.getContactPerson(), f.getPhone(), f.getEmail(),
                f.getAddress(), f.getServiceDate(), f.getArrivalTime(), f.getDeliveryTime(),
                f.getNotification(), f.getStaffCount(), f.getServiceLocation(), f.getServiceStatus(),
                f.getFaultDescription(), f.getServiceDescription(), f.getDeliveryNotes(),
                f.getCustomerSignature(), f.getTechnicianSignature(), f.getSyncStatus(),
                products,
                f.getTechnician() != null ? f.getTechnician().getUsername() : null,
                f.getCreatedAt(), f.getUpdatedAt()
        );
    }
}
