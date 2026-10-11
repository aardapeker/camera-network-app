package com.aardapeker.app.serviceform;

import com.aardapeker.app.component.ComponentFieldType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record SubmitServiceFormRequest(
        @NotBlank String customerName,
        String contactPerson,
        String phone,
        String email,
        String address,
        @NotNull LocalDate serviceDate,
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
        List<ProductDto> products
) {
    public record ProductDto(
            @NotBlank String productName,
            int quantity,
            List<FieldValueDto> fieldValues
    ) {}

    public record FieldValueDto(
            @NotBlank String label,
            @NotNull ComponentFieldType fieldType,
            String value
    ) {}
}
