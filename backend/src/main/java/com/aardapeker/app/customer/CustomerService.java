package com.aardapeker.app.customer;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomerService {

    /** Directory search for the service form combobox. */
    List<CustomerSite> search(String query);

    /** Best single match for a phrase a technician dictated, e.g. "Barsan Samandira". */
    Optional<CustomerSite> resolve(String phrase);

    List<Customer> getAll();

    Customer create(String name, String shortName);

    Customer update(UUID id, String name, String shortName);

    void delete(UUID id);

    CustomerSite addSite(UUID customerId, CustomerRequests.SaveCustomerSiteRequest request);

    CustomerSite updateSite(UUID customerId, UUID siteId, CustomerRequests.SaveCustomerSiteRequest request);

    void deleteSite(UUID customerId, UUID siteId);

    CustomerSite quickAdd(CustomerRequests.QuickAddCustomerRequest request);
}
