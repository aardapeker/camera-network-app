package com.aardapeker.app.customer;

import java.util.UUID;

/**
 * One selectable directory entry. {@code name} is the combobox display label,
 * which is why it carries the customer and site together.
 */
public record CustomerSiteResponse(
        UUID id,
        String name,
        UUID customerId,
        String customerName,
        String siteLabel,
        String address,
        String contactPerson,
        String phone,
        String email) {

    public static CustomerSiteResponse from(CustomerSite site) {
        Customer customer = site.getCustomer();
        String label = site.getLabel() == null || site.getLabel().isBlank()
                ? customer.getName()
                : customer.getName() + " — " + site.getLabel();
        return new CustomerSiteResponse(
                site.getId(),
                label,
                customer.getId(),
                customer.getName(),
                site.getLabel(),
                site.getAddress(),
                site.getContactPerson(),
                site.getPhone(),
                site.getEmail());
    }
}
