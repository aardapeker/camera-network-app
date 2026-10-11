package com.aardapeker.app.formtemplate;

import com.aardapeker.app.component.ComponentFieldType;
import com.aardapeker.app.customer.CustomerSiteResponse;

import java.util.List;
import java.util.UUID;

public record TemplateDraftResponse(
        String faultDescription,
        String serviceDescription,
        String deliveryNotes,
        List<DraftProduct> products,
        /** Resolved from the directory when the technician named a customer, otherwise null. */
        CustomerSiteResponse customer) {

    /**
     * A material the model proposed. When the name matches the catalogue,
     * {@code componentId} is set and {@code fields} carries that component's
     * fields with any brand/model the technician dictated already filled in.
     * Unmatched materials stay as a plain name - no catalogue entry is created.
     */
    public record DraftProduct(
            UUID componentId,
            String productName,
            int quantity,
            List<DraftFieldValue> fields) {
    }

    public record DraftFieldValue(String label, ComponentFieldType fieldType, String value) {
    }
}
