package com.aardapeker.app.validation;

import com.aardapeker.app.exception.BadRequestException;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class TestValidator {

    public void validateEmbeddingRequest(String text) {
        if (text == null || text.isEmpty()) {
            throw new BadRequestException("Text is required");
        }
    }

    public void validateSimilarityRequest(String text1, String text2) {
        if (text1 == null || text1.isEmpty() || text2 == null || text2.isEmpty()) {
            throw new BadRequestException("Both text1 and text2 are required");
        }
    }

    public void validateSearchQuery(String query) {
        if (query == null || query.isEmpty()) {
            throw new BadRequestException("Query is required");
        }
    }

    public void validateDocuments(List<Map<String, Object>> documents) {
        if (documents == null || documents.isEmpty()) {
            throw new BadRequestException("Documents array is required");
        }
    }

    public void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new BadRequestException("Image is required");
        }
    }
}
