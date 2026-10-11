package com.aardapeker.app.customer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface CustomerSiteRepository extends JpaRepository<CustomerSite, UUID> {

    @Query("SELECT s FROM CustomerSite s JOIN FETCH s.customer ORDER BY s.customer.name ASC, s.orderIndex ASC")
    List<CustomerSite> findAllWithCustomer();
}
