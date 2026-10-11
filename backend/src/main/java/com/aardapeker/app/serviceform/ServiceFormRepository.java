package com.aardapeker.app.serviceform;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServiceFormRepository extends JpaRepository<ServiceForm, UUID> {

    @Query("SELECT f FROM ServiceForm f LEFT JOIN FETCH f.products LEFT JOIN FETCH f.technician ORDER BY f.createdAt DESC")
    List<ServiceForm> findAllWithDetails();

    @Query("SELECT f FROM ServiceForm f LEFT JOIN FETCH f.products LEFT JOIN FETCH f.technician WHERE f.technician.username = :username ORDER BY f.createdAt DESC")
    List<ServiceForm> findByTechnicianUsername(@Param("username") String username);

    @Query("SELECT f FROM ServiceForm f LEFT JOIN FETCH f.products LEFT JOIN FETCH f.technician WHERE f.id = :id")
    Optional<ServiceForm> findByIdWithDetails(@Param("id") UUID id);
}
