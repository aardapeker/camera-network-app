package com.aardapeker.app.audio;

import com.aardapeker.app.exception.BadRequestException;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AudioTranscriptionServiceImpl implements AudioTranscriptionService {

    private static final Logger logger = LoggerFactory.getLogger(AudioTranscriptionServiceImpl.class);
    private static final String OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";

    @Value("${openai.api-key:}")
    private String openaiApiKey;

    private final RestTemplate restTemplate;

    public AudioTranscriptionServiceImpl() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public String transcribe(MultipartFile file, String language) {
        if (openaiApiKey == null || openaiApiKey.isBlank()) {
            throw new BadRequestException("Speech-to-text is not configured on this server");
        }
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No audio file provided");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(openaiApiKey);
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            String originalName = file.getOriginalFilename();
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return (originalName != null && !originalName.isBlank()) ? originalName : "audio.webm";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);
            body.add("model", "whisper-1");
            if (language != null && !language.isBlank()) {
                body.add("language", language);
            }

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<OpenAiTranscriptionApiResponse> response = restTemplate.postForEntity(
                    OPENAI_TRANSCRIPTION_URL, requestEntity, OpenAiTranscriptionApiResponse.class);

            OpenAiTranscriptionApiResponse result = response.getBody();
            return result != null && result.text() != null ? result.text().trim() : "";
        } catch (IOException e) {
            logger.error("Failed to read uploaded audio file: {}", e.getMessage());
            throw new BadRequestException("Failed to read uploaded audio file");
        } catch (RestClientException e) {
            logger.error("OpenAI transcription request failed: {}", e.getMessage());
            throw new BadRequestException("Speech-to-text request failed: " + e.getMessage());
        }
    }
}
