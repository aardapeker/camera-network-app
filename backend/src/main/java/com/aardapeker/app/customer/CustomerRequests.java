package com.aardapeker.app.customer;

import jakarta.validation.constraints.NotBlank;

public final class CustomerRequests {

    private CustomerRequests() {}

    public record SaveCustomerRequest(@NotBlank String name, String shortName) {}

    public record SaveCustomerSiteRequest(
            @NotBlank String label,
            String address,
            String contactPerson,
            String phone,
            String email) {}

    /** Inline "add new" from the service form: creates the customer and its first site at once. */
    public record QuickAddCustomerRequest(
            @NotBlank String customerName,
            String siteLabel,
            String address,
            String contactPerson,
            String phone) {}
}
