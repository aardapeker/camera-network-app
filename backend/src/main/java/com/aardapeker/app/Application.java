package com.aardapeker.app;

import com.aardapeker.app.dto.request.AddUserRequest;
import com.aardapeker.app.model.Role;
import com.aardapeker.app.repository.UserRepository;
import com.aardapeker.app.service.AdminService;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application implements CommandLineRunner {

    private final AdminService adminService;
    private final UserRepository userRepository;
    private final String initialAdminPassword;

    public Application(
        AdminService adminService,
        UserRepository userRepository,
        @Value("${admin.initial-password:}") String initialAdminPassword
    ) {
        this.adminService = adminService;
        this.userRepository = userRepository;
        this.initialAdminPassword = initialAdminPassword;
    }

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByUsername("root")) {
            // Root exists (e.g. after a DB restore) — ensure ROLE_ADMIN is present.
            // A restore can leave the authorities row missing due to FK ordering issues.
            userRepository.findByUsername("root").ifPresent(root -> {
                if (!root.getAuthorities().contains(Role.ROLE_ADMIN)) {
                    root.getAuthorities().add(Role.ROLE_ADMIN);
                    userRepository.save(root);
                    System.out.println("✅ Repaired missing ROLE_ADMIN for root user");
                }
            });
            return;
        }

        // Never ship a hardcoded admin password. Use ADMIN_INITIAL_PASSWORD if set,
        // otherwise generate a random one and print it once so the operator can log in
        // and change it.
        boolean generated = initialAdminPassword == null || initialAdminPassword.isBlank();
        String password = generated ? generatePassword() : initialAdminPassword;

        adminService.addUser(
            AddUserRequest.builder()
                .firstName("root")
                .lastName("user")
                .username("root")
                .email("root@internal.local")
                .password(password)
                .profilePictureUrl("")
                .authorities(Set.of(Role.ROLE_ADMIN))
                .build()
        );

        System.out.println("✅ Admin user 'root' created");
        if (generated) {
            System.out.println("🔑 Generated initial root password (shown once, change it after login): " + password);
        }
    }

    private static String generatePassword() {
        byte[] bytes = new byte[18];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
