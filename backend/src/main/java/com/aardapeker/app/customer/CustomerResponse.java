package com.aardapeker.app.customer;

import java.util.List;
import java.util.UUID;

public record CustomerResponse(
        UUID id,
        String name,
        String shortName,
        List<CustomerSiteResponse> sites) {

    public static CustomerResponse from(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getShortName(),
                customer.getSites().stream().map(CustomerSiteResponse::from).toList());
    }
}
