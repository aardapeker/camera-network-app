package com.aardapeker.app.controller;

import com.aardapeker.app.dto.request.FileDeleteRequest;
import com.aardapeker.app.dto.request.FileDownloadRequest;
import com.aardapeker.app.dto.response.BlueprintUploadResponse;
import com.aardapeker.app.dto.response.FileDeleteResponse;
import com.aardapeker.app.dto.response.FileListResponse;
import com.aardapeker.app.dto.response.FileUploadResponse;
import com.aardapeker.app.exception.ForbiddenActionException;
import com.aardapeker.app.model.Role;
import com.aardapeker.app.model.User;
import com.aardapeker.app.policy.FilePolicy;
import com.aardapeker.app.service.FileService;
import com.aardapeker.app.mapper.FileMapper;
import com.aardapeker.app.validation.FileValidator;
import com.aardapeker.app.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/files")
public class FileController {

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    private final FileService fileService;
    private final FileValidator fileValidator;
    private final FilePolicy filePolicy;
    private final FileMapper fileMapper;

    public FileController(
            FileService fileService,
            FileValidator fileValidator,
            FilePolicy filePolicy,
            FileMapper fileMapper) {
        this.fileService = fileService;
        this.fileValidator = fileValidator;
        this.filePolicy = filePolicy;
        this.fileMapper = fileMapper;
    }

    @GetMapping
    public ResponseEntity<FileListResponse> listFiles(
            @AuthenticationPrincipal User user) {
        filePolicy.validateUserCanListFiles(user);
        List<String> files = fileService.listFilesForUser(user);
        return ResponseEntity.ok(fileMapper.toListResponse(files));
    }

    @PostMapping(value = "upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        fileValidator.validateFileForUpload(file);
        String profilePictureUrl = fileService.uploadProfilePicture(file, user);
        return ResponseEntity.ok(
                fileMapper.toUploadResponse(user.getUsername(), profilePictureUrl, file));
    }

    @PostMapping(value = "upload-blueprint", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BlueprintUploadResponse> uploadBlueprintFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "clientUsername", required = false) String clientUsername,
            @AuthenticationPrincipal User user) {
        fileValidator.validateFileForUpload(file);

        boolean isTech = user != null && user.getAuthorities() != null &&
                user.getAuthorities().contains(Role.ROLE_TECH);
        if (isTech && clientUsername != null && !clientUsername.isBlank()) {
            throw new ForbiddenActionException("Tech users cannot upload blueprints for clients");
        }

        String blueprintPictureUrl = fileService.uploadBlueprintPicture(file, clientUsername);
        return ResponseEntity.ok(
                fileMapper.toBlueprintUploadResponse(clientUsername, blueprintPictureUrl, file));
    }

    @DeleteMapping("delete")
    public ResponseEntity<FileDeleteResponse> deleteFile(
            @Valid @RequestBody FileDeleteRequest request,
            @AuthenticationPrincipal User user) {
        fileValidator.validateFileName(request.fileName());
        fileService.deleteProfilePicture(request.fileName(), user);
        return ResponseEntity.ok(
                fileMapper.toDeleteResponse(user.getUsername(), request.fileName()));
    }

    @DeleteMapping("delete-blueprint")
    public ResponseEntity<FileDeleteResponse> deleteBlueprintFile(
            @Valid @RequestBody FileDeleteRequest request,
            @AuthenticationPrincipal User user) {
        fileValidator.validateFileName(request.fileName());
        fileService.deleteBlueprintPicture(request.fileName(), user);
        return ResponseEntity.ok(
                fileMapper.toDeleteResponse(user.getUsername(), request.fileName()));
    }

    @GetMapping("download")
    public ResponseEntity<ByteArrayResource> downloadFile(
            @Valid @ModelAttribute FileDownloadRequest request,
            @AuthenticationPrincipal User user) {
        fileValidator.validateFileName(request.fileName());
        ByteArrayResource resource = fileService.downloadFile(request.fileName(), user);
        return buildDownloadResponse(resource, request.fileName(), user.getUsername());
    }

    @GetMapping("proxy-blueprint")
    public ResponseEntity<ByteArrayResource> proxyBlueprint(
            @RequestParam("url") String blueprintUrl,
            @AuthenticationPrincipal User user) {
        ByteArrayResource resource = fileService.downloadBlueprintByUrl(blueprintUrl);

        // Determine content type from URL
        String contentType = "image/png";
        if (blueprintUrl.toLowerCase().endsWith(".jpg") || blueprintUrl.toLowerCase().endsWith(".jpeg")) {
            contentType = "image/jpeg";
        } else if (blueprintUrl.toLowerCase().endsWith(".gif")) {
            contentType = "image/gif";
        } else if (blueprintUrl.toLowerCase().endsWith(".webp")) {
            contentType = "image/webp";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                .body(resource);
    }

    @GetMapping("serve/**")
    public ResponseEntity<ByteArrayResource> serveFile(HttpServletRequest request) {
        // Extract the file path from the URL after /files/serve/
        String requestUri = request.getRequestURI();
        String filePath = requestUri.substring(requestUri.indexOf("/files/serve/") + "/files/serve/".length());

        // Validate path to prevent directory traversal
        if (filePath.contains("..") || filePath.contains("//")) {
            throw new ResourceNotFoundException("Invalid file path");
        }

        Path baseDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path path = baseDir.resolve(filePath).normalize();
        if (!path.startsWith(baseDir)) {
            throw new ResourceNotFoundException("Invalid file path");
        }

        if (!Files.exists(path) || !Files.isRegularFile(path)) {
            throw new ResourceNotFoundException("File not found: " + filePath);
        }

        try {
            byte[] content = Files.readAllBytes(path);
            ByteArrayResource resource = new ByteArrayResource(content);

            // Determine content type from file extension
            String contentType = determineContentType(filePath);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                    .body(resource);
        } catch (IOException e) {
            throw new ResourceNotFoundException("Failed to read file: " + filePath);
        }
    }

    private String determineContentType(String filePath) {
        String lowerPath = filePath.toLowerCase();
        if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowerPath.endsWith(".gif")) {
            return "image/gif";
        } else if (lowerPath.endsWith(".webp")) {
            return "image/webp";
        } else if (lowerPath.endsWith(".svg")) {
            return "image/svg+xml";
        }
        return "image/png";
    }

    private ResponseEntity<ByteArrayResource> buildDownloadResponse(
            ByteArrayResource resource,
            String fileName,
            String username) {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"");
        headers.add("X-Username", username);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .headers(headers)
                .body(resource);
    }
}
