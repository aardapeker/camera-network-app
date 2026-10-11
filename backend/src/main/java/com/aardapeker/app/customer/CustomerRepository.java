package com.aardapeker.app.customer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Optional<Customer> findFirstByNameIgnoreCase(String name);

    @Query("SELECT DISTINCT c FROM Customer c LEFT JOIN FETCH c.sites ORDER BY c.name ASC")
    List<Customer> findAllWithSites();
}
