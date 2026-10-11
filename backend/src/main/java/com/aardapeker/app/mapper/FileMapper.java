package com.aardapeker.app.mapper;

import com.aardapeker.app.dto.response.BlueprintUploadResponse;
import com.aardapeker.app.dto.response.FileDeleteResponse;
import com.aardapeker.app.dto.response.FileListResponse;
import com.aardapeker.app.dto.response.FileUploadResponse;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class FileMapper {

    public FileUploadResponse toUploadResponse(
        String username,
        String profilePictureUrl,
        MultipartFile file
    ) {
        return FileUploadResponse.of(
            username,
            profilePictureUrl,
            file.getOriginalFilename(),
            file.getSize(),
            file.getContentType()
        );
    }

    public BlueprintUploadResponse toBlueprintUploadResponse(
        String username,
        String blueprintPictureUrl,
        MultipartFile file
    ) {
        return BlueprintUploadResponse.of(
            username,
            blueprintPictureUrl,
            file.getOriginalFilename(),
            file.getSize(),
            file.getContentType()
        );
    }

    public FileDeleteResponse toDeleteResponse(String username, String fileName) {
        String folderPath = "users/" + username + "/profile-picture";
        return FileDeleteResponse.of(username, fileName, folderPath);
    }

    public FileListResponse toListResponse(List<String> files) {
        return FileListResponse.of(files);
    }
}
