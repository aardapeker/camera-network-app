package com.aardapeker.app.serviceform;

import com.aardapeker.app.model.User;

import java.util.List;
import java.util.UUID;

public interface ServiceFormService {

    ServiceForm submit(SubmitServiceFormRequest request, User technician);

    ServiceForm getById(UUID id);

    List<ServiceForm> getAll();

    List<ServiceForm> getByTechnician(String username);

    void delete(UUID id);
}
