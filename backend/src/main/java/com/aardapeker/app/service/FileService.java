package com.aardapeker.app.service;

import com.aardapeker.app.model.User;
import java.util.List;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.web.multipart.MultipartFile;

public interface FileService {
    List<String> listFilesForUser(User user);

    List<String> listAllFiles();

    String uploadProfilePicture(MultipartFile file, User user);

    String uploadBlueprintPicture(MultipartFile file, String clientUsername);

    void deleteProfilePicture(String fileName, User user);

    void deleteBlueprintPicture(String fileName, User user);

    ByteArrayResource downloadFile(String fileName, User user);

    ByteArrayResource downloadBlueprintByUrl(String blueprintUrl);
}
