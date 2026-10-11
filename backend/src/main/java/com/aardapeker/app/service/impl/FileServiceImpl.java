package com.aardapeker.app.service.impl;

import com.aardapeker.app.exception.FileStorageException;
import com.aardapeker.app.exception.ResourceNotFoundException;
import com.aardapeker.app.model.User;
import com.aardapeker.app.policy.FilePolicy;
import com.aardapeker.app.service.FileService;
import com.aardapeker.app.service.UserService;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileServiceImpl implements FileService {

    @Value("${file.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${file.base-url}")
    private String baseUrl;

    private final UserService userService;
    private final FilePolicy filePolicy;

    public FileServiceImpl(
            UserService userService,
            FilePolicy filePolicy) {
        this.userService = userService;
        this.filePolicy = filePolicy;
    }

    @PostConstruct
    public void init() {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (IOException e) {
            throw new FileStorageException("Could not create upload directory: " + uploadDir, e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listFilesForUser(User user) {
        String userPrefix = "users/" + user.getUsername() + "/";
        return listFilesWithPrefix(userPrefix);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listAllFiles() {
        return listFilesWithPrefix("users/");
    }

    @Override
    @Transactional
    public String uploadProfilePicture(MultipartFile file, User user) {
        try {
            String username = user.getUsername();
            String extension = extractFileExtension(file.getOriginalFilename());
            String folderPath = buildUserFolderPath(username);

            deleteAllFilesInFolder(folderPath);

            String fileName = buildFileName(username, extension);
            String fullPath = folderPath + "/" + fileName;

            uploadFileToStorage(file, fullPath);

            String profilePictureUrl = buildProfilePictureUrl(username, fileName);
            userService.updateProfilePictureUrl(username, profilePictureUrl);

            return profilePictureUrl;
        } catch (IOException e) {
            throw new FileStorageException(
                    "Failed to upload profile picture for user: " + user.getUsername(),
                    e);
        }
    }

    @Override
    @Transactional
    public String uploadBlueprintPicture(MultipartFile file, String clientUsername) {
        try {
            String extension = extractFileExtension(file.getOriginalFilename());
            String folderPath = buildBlueprintFolderPath(clientUsername);

            String fileName = buildBlueprintFileName(clientUsername, extension);
            String fullPath = folderPath + "/" + fileName;

            uploadFileToStorage(file, fullPath);

            String blueprintPictureUrl = buildBlueprintPictureUrl(clientUsername, fileName);

            return blueprintPictureUrl;
        } catch (IOException e) {
            throw new FileStorageException(
                    "Failed to upload blueprint picture for client: " + clientUsername,
                    e);
        }
    }

    @Override
    @Transactional
    public void deleteProfilePicture(String fileName, User user) {
        String username = user.getUsername();
        String folderPath = buildUserFolderPath(username);
        String fullPath = buildFullPath(folderPath, fileName);

        filePolicy.validateUserCanDeleteFile(user, fullPath);

        Path filePath = Paths.get(uploadDir, fullPath);

        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("File not found: " + fileName);
        }

        try {
            Files.delete(filePath);
        } catch (IOException e) {
            throw new FileStorageException("Failed to delete file: " + fileName, e);
        }

        userService.updateProfilePictureUrl(username, null);
    }

    @Override
    @Transactional
    public void deleteBlueprintPicture(String fileName, User user) {
        String username = user.getUsername();
        String folderPath = buildBlueprintFolderPath(username);
        String fullPath = buildFullPath(folderPath, fileName);

        filePolicy.validateUserCanDeleteFile(user, fullPath);

        Path filePath = Paths.get(uploadDir, fullPath);

        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("File not found: " + fileName);
        }

        try {
            Files.delete(filePath);
        } catch (IOException e) {
            throw new FileStorageException("Failed to delete file: " + fileName, e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ByteArrayResource downloadFile(String fileName, User user) {
        filePolicy.validateUserCanAccessFile(user, fileName);

        Path filePath = Paths.get(uploadDir, fileName);

        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("File not found: " + fileName);
        }

        try {
            byte[] content = Files.readAllBytes(filePath);
            return new ByteArrayResource(content);
        } catch (IOException e) {
            throw new FileStorageException("Failed to read file: " + fileName, e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ByteArrayResource downloadBlueprintByUrl(String blueprintUrl) {
        // Extract the file path from the URL
        // URL format: {anyHost}/files/serve/{path}
        final String SERVE_SEGMENT = "/files/serve/";

        // Decode the URL in case it is URL-encoded
        String decodedUrl = URLDecoder.decode(blueprintUrl, StandardCharsets.UTF_8);

        int serveIndex = decodedUrl.indexOf(SERVE_SEGMENT);
        if (serveIndex == -1) {
            throw new ResourceNotFoundException(
                    "Invalid blueprint URL: missing '/files/serve/' segment in: " + blueprintUrl);
        }

        String filePath = decodedUrl.substring(serveIndex + SERVE_SEGMENT.length());

        Path path = Paths.get(uploadDir, filePath);

        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Blueprint not found at path: " + filePath);
        }

        try {
            byte[] content = Files.readAllBytes(path);
            return new ByteArrayResource(content);
        } catch (IOException e) {
            throw new FileStorageException("Failed to download blueprint: " + e.getMessage(), e);
        }
    }

    // Private helper methods

    private List<String> listFilesWithPrefix(String prefix) {
        List<String> list = new ArrayList<>();
        Path basePath = Paths.get(uploadDir, prefix);

        if (!Files.exists(basePath)) {
            return list;
        }

        try (Stream<Path> paths = Files.walk(basePath)) {
            paths.filter(Files::isRegularFile)
                    .forEach(path -> {
                        String relativePath = Paths.get(uploadDir).relativize(path).toString();
                        // Normalize path separators to forward slashes
                        list.add(relativePath.replace("\\", "/"));
                    });
        } catch (IOException e) {
            throw new FileStorageException("Failed to list files with prefix: " + prefix, e);
        }

        return list;
    }

    private String extractFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    private String buildUserFolderPath(String username) {
        return "users/" + username + "/profile-picture";
    }

    private String buildBlueprintFolderPath(String username) {
        if (username == null || username.isBlank()) {
            return "blueprints/unassigned";
        }
        return "users/" + username + "/blueprints";
    }

    private String buildFileName(String username, String extension) {
        return username + "-profile-picture" + extension;
    }

    private String buildBlueprintFileName(String username, String extension) {
        String label = (username == null || username.isBlank()) ? "unassigned" : username;
        return "blueprint-" + label + "-" + System.currentTimeMillis() + extension;
    }

    private String buildFullPath(String folderPath, String fileName) {
        String cleanFileName = fileName.startsWith(folderPath + "/")
                ? fileName.substring((folderPath + "/").length())
                : fileName;
        return folderPath + "/" + cleanFileName;
    }

    private String buildProfilePictureUrl(String username, String fileName) {
        return String.format(
                "%s/files/serve/users/%s/profile-picture/%s",
                baseUrl,
                username,
                fileName);
    }

    private String buildBlueprintPictureUrl(String username, String fileName) {
        if (username == null || username.isBlank()) {
            return String.format("%s/files/serve/blueprints/unassigned/%s", baseUrl, fileName);
        }
        return String.format(
                "%s/files/serve/users/%s/blueprints/%s",
                baseUrl,
                username,
                fileName);
    }

    private void deleteAllFilesInFolder(String folderPath) {
        Path folder = Paths.get(uploadDir, folderPath);

        if (!Files.exists(folder)) {
            return;
        }

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(folder)) {
            for (Path file : stream) {
                if (Files.isRegularFile(file)) {
                    Files.delete(file);
                }
            }
        } catch (IOException e) {
            throw new FileStorageException("Failed to delete files in folder: " + folderPath, e);
        }
    }

    private void uploadFileToStorage(MultipartFile file, String fullPath)
            throws IOException {
        Path targetPath = Paths.get(uploadDir, fullPath);

        // Create parent directories if they don't exist
        Files.createDirectories(targetPath.getParent());

        // Save the file
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
    }
}
